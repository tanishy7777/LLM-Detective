import os
import json
import time
import re
import difflib
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from tqdm import tqdm

MODEL_PATH = "mistralai/Mistral-7B-Instruct-v0.3"
JSON_PATH = "texts.json"
SAVE_DIR = "checkpoints"
os.makedirs(SAVE_DIR, exist_ok=True)

PROMPT_TEMPLATE = """
---BEGIN TEXT---
{text}
---END TEXT---

INSTRUCTIONS:
Polish the above text for grammar, clarity, and natural flow while keeping the original meaning, tone, and length intact.
Do NOT shorten or summarize. Do NOT add new information or stylistic flourishes beyond minor improvements for readability.
Keep all factual details and paragraph structure the same.

Output only the polished version — no explanations, notes, or extra text.

Output starts after the next blank line:
"""

BATCH_SIZE = 1
MAX_NEW_TOKENS = 256     
MIN_NEW_TOKENS = 80
MIN_WORDS = 40

N_RETRIES = 3
GEN_ARGS_BASE = dict(
    max_new_tokens=MAX_NEW_TOKENS,
    min_new_tokens=MIN_NEW_TOKENS,
    do_sample=False,        
    temperature=0.0,
    top_p=1.0,
    top_k=0,
    repetition_penalty=1.0,
    no_repeat_ngram_size=3,
    use_cache=True,
)

SAVE_INTERVAL_INITIAL = 5
SAVE_INTERVAL_REGULAR = 100


def enable_flash_sdp():
    try:
        torch.backends.cuda.enable_flash_sdp(True)
    except Exception:
        pass


def clean_text(s: str) -> str:
    if s is None:
        return ""
    s = s.replace("\r", " ").replace("\t", " ")
    s = " ".join(s.split())
    s = re.sub(r'^[\s\.,\-:;]+', '', s)
    return s.strip()


BLACKLIST_SUBSTRINGS = [
    "good luck", "please let me", "please note", "note:", "your name", "i am an ai",
    "©", "http://", "https://", "www.", "References:", "References", "End of Original",
    "All rights reserved"
]
PUNCT_ONLY = re.compile(r'^[\W_]+$')


def strip_boilerplate(s: str) -> str:
    if not s:
        return s
    s = re.sub(r'(?i)^\s*[-=]{0,3}\s*begin (polished|polish) text[^\n]*\n', '', s)
    s = re.sub(r'(?i)\n[-=]{0,3}\s*end (polished|polish) text.*$', '', s)
    s = re.sub(r'(?i)^\s*begin polished text[^\n]*', '', s)
    s = re.sub(r'(?i)\nend polished text.*$', '', s)
    s = re.sub(r'(?is)\bnote:.*$', '', s)
    s = re.sub(r'(?is)(please (let me|provide).*)$', '', s)
    s = re.sub(r'(?is)thanks(,|\.|\s).*$', '', s)
    s = re.sub(r'\([^)]{1,120}\)', '', s)
    return s.strip()


def normalize(s: str) -> str:
    return clean_text(s or "")


def similarity_ratio(a: str, b: str) -> float:
    try:
        return difflib.SequenceMatcher(a=a, b=b).ratio()
    except Exception:
        return 0.0


def is_valid_output(decoded: str, src_text: str) -> bool:
    if not decoded:
        return False
    decoded = strip_boilerplate(decoded)
    decoded = normalize(decoded)
    src_text = normalize(src_text)

    if len(decoded.split()) < MIN_WORDS:
        return False
    if len(decoded) < 30:
        return False

    low = decoded.lower()
    for bad in BLACKLIST_SUBSTRINGS:
        if bad in low:
            return False
    if PUNCT_ONLY.match(decoded):
        return False

    if decoded == src_text:
        return False

    sim = similarity_ratio(src_text, decoded) if src_text and decoded else 0.0
    if sim >= 0.999:
        return False

    return True


def make_prompt_from_text(text: str, template: str, tokenizer, max_new_tokens: int):
    safety_margin = 8
    avail = tokenizer.model_max_length - max_new_tokens - safety_margin
    if avail < 64:
        avail = tokenizer.model_max_length - max_new_tokens - 1
        if avail < 32:
            avail = max(32, tokenizer.model_max_length // 2)

    enc = tokenizer(text, return_tensors="pt", truncation=False)
    toks = enc["input_ids"][0]
    truncated = False
    if toks.shape[0] > avail:
        toks = toks[:avail]
        text = tokenizer.decode(toks, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        truncated = True
    prompt = template.format(text=text)
    return prompt, truncated


print("Enabling flash sdp (if available)...")
enable_flash_sdp()

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
if not getattr(tokenizer, 'model_max_length', None):
    tokenizer.model_max_length = 4096

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"Loaded {len(data)} items from {JSON_PATH}")

original_texts = [item.get("text", "") for item in data]
ids = [item.get("id", str(i)) for i, item in enumerate(data)]

prompts = []
truncation_log = []
for t in original_texts:
    prompt, truncated = make_prompt_from_text(t, PROMPT_TEMPLATE, tokenizer, MAX_NEW_TOKENS)
    prompts.append(prompt)
    truncation_log.append(truncated)

with open("prompt_truncation.log", "w", encoding="utf-8") as fh:
    for idx, tr in enumerate(truncation_log):
        if tr:
            fh.write(json.dumps({"id": ids[idx], "truncated": True}) + "\n")

print("Loading model (4-bit bnb config)...")
bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=False,
    low_cpu_mem_usage=True
)
model.eval()
device = next(model.parameters()).device
print("Model loaded on", device)

model_max_ctx = getattr(tokenizer, 'model_max_length', None)
try:
    cfg_max = getattr(model.config, 'max_position_embeddings', None)
    if cfg_max:
        model_max_ctx = min(model_max_ctx or cfg_max, cfg_max)
except Exception:
    pass
if model_max_ctx is None:
    model_max_ctx = 4096

results = []
times = []
start_total = time.time()
raw_attempts_fpath = "raw_attempts.jsonl"
open(raw_attempts_fpath, "a", encoding="utf-8").close()

def safe_tokenize_prompts(batch_prompts, tokenizer, model_max_ctx, max_new_tokens):
    safety_margin = 8
    safe_input_max = model_max_ctx - max_new_tokens - safety_margin
    if safe_input_max < 32:
        safe_input_max = max(32, model_max_ctx - max_new_tokens - 1)
    return tokenizer(batch_prompts, return_tensors="pt", padding=True, truncation=True, max_length=safe_input_max)

for i in tqdm(range(0, len(prompts), BATCH_SIZE), desc="Processing batches"):
    batch_prompts = prompts[i:i+BATCH_SIZE]
    batch_ids = ids[i:i+BATCH_SIZE]

    inputs = safe_tokenize_prompts(batch_prompts, tokenizer, model_max_ctx, MAX_NEW_TOKENS).to(device)
    input_lengths = inputs["attention_mask"].sum(dim=1).to("cpu")

    for b_idx, l in enumerate(input_lengths.tolist()):
        if l + MAX_NEW_TOKENS > model_max_ctx:
            print(f"[WARN] sample {batch_ids[b_idx]} length {l} + MAX_NEW_TOKENS {MAX_NEW_TOKENS} > model max {model_max_ctx}")

    start_batch = time.time()
    final_decoded = [None] * len(batch_prompts)
    per_sample_attempts = [[] for _ in range(len(batch_prompts))]

    for attempt in range(N_RETRIES):
        gen_args = GEN_ARGS_BASE.copy()
        if attempt > 0:
            gen_args["do_sample"] = True
            gen_args["temperature"] = min(0.6, gen_args.get("temperature", 0.0) + 0.2 * attempt)
            gen_args["top_p"] = min(0.995, gen_args.get("top_p", 1.0))

        try:
            with torch.no_grad():
                outputs = model.generate(**inputs, **gen_args)
        except RuntimeError as e:
            print("Generation runtime error:", str(e))
            torch.cuda.empty_cache()
            gen_args_sm = gen_args.copy()
            gen_args_sm["max_new_tokens"] = max(64, gen_args_sm.get("max_new_tokens", MAX_NEW_TOKENS) // 2)
            try:
                with torch.no_grad():
                    outputs = model.generate(**inputs, **gen_args_sm)
            except Exception as e2:
                print("Retry failed:", e2)
                outputs = None

        if outputs is None:
            continue

        for b in range(len(batch_prompts)):
            idx = i + b
            inp_len = int(input_lengths[b].item())
            out_ids = outputs[b, inp_len:].cpu().tolist()
            decoded = tokenizer.decode(out_ids, skip_special_tokens=True).strip()
            decoded = clean_text(decoded)
            decoded_stripped = strip_boilerplate(decoded)

            src_text = original_texts[idx]
            normalized_decoded = normalize(decoded_stripped)
            normalized_src = normalize(src_text)
            sim = similarity_ratio(normalized_src, normalized_decoded) if normalized_src and normalized_decoded else 0.0

            attempt_record = {
                "id": batch_ids[b],
                "attempt": attempt,
                "decoded_len": len(normalized_decoded.split()),
                "decoded_preview": normalized_decoded[:400],
                "similarity": sim,
                "truncated_prompt": truncation_log[idx]
            }

            with open(raw_attempts_fpath, "a", encoding="utf-8") as rawfh:
                rawfh.write(json.dumps(attempt_record, ensure_ascii=False) + "\n")

            per_sample_attempts[b].append((decoded, attempt_record))

            debug_fname = "debug_attempts.log"
            with open(debug_fname, "a", encoding="utf-8") as dbg:
                dbg.write(json.dumps({
                    "id": batch_ids[b],
                    "attempt": attempt,
                    "decoded_len": len(normalized_decoded.split()),
                    "decoded_preview": normalized_decoded[:400],
                    "similarity": sim
                }, ensure_ascii=False) + "\n")

            valid = False
            try:
                valid = is_valid_output(decoded, src_text)
            except Exception:
                valid = False

            if valid and final_decoded[b] is None:
                final_decoded[b] = decoded_stripped

        if all(x is not None for x in final_decoded):
            break

    for b in range(len(batch_prompts)):
        if final_decoded[b] is not None:
            chosen = final_decoded[b]
        else:
            attempts = per_sample_attempts[b]
            chosen = ""
            if attempts:
                long_candidates = [(d, r) for d, r in attempts if r["decoded_len"] >= MIN_WORDS]
                if long_candidates:
                    best = min(long_candidates, key=lambda dr: dr[1]["similarity"])
                    if best[1]["similarity"] < 0.999:
                        chosen = strip_boilerplate(best[0])
                    else:
                        best2 = max(long_candidates, key=lambda dr: dr[1]["decoded_len"])
                        chosen = strip_boilerplate(best2[0])
                else:
                    best3 = max(attempts, key=lambda dr: dr[1]["decoded_len"]) if attempts else (None, None)
                    chosen = strip_boilerplate(best3[0]) if best3 and best3[0] else ""

            if chosen:
                if normalize(chosen) == normalize(original_texts[i + b]):
                    chosen = ""

        results.append({
            "id": batch_ids[b],
            "elapsed_sec": (time.time() - start_batch) / max(1, len(batch_prompts)),
            "output": chosen
        })

    end_batch = time.time()
    times.append((end_batch - start_batch) / max(1, len(batch_prompts)))

    try:
        del inputs, outputs
    except Exception:
        pass
    torch.cuda.empty_cache()

    batch_idx = i // BATCH_SIZE + 1
    if batch_idx == SAVE_INTERVAL_INITIAL or (batch_idx > SAVE_INTERVAL_INITIAL and batch_idx % SAVE_INTERVAL_REGULAR == 0):
        save_path = os.path.join(SAVE_DIR, f"polished_outputs_batch_{batch_idx}.json")
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\nCheckpoint saved: {save_path} ({len(results)} items).")

total_time = time.time() - start_total
print("\n--- Benchmark Summary ---")
print(f"Total time: {total_time:.2f}s")
if times:
    print(f"Avg per prompt: {sum(times)/len(times):.2f}s")
    print(f"Throughput: {len(data)/total_time:.2f} prompts/sec")

with open("polished_outputs_final.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Done. Final results saved to polished_outputs_final.json")
