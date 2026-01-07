import os, json, time, re, torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from tqdm import tqdm

torch.set_flush_denormal(True)


MODEL_PATH = "meta-llama/Llama-2-7b-chat-hf"
JSON_PATH = "texts.json"
SAVE_DIR = "checkpoints"
os.makedirs(SAVE_DIR, exist_ok=True)

PROMPT_TEMPLATE = """
---BEGIN SAMPLE---
{text}
---END SAMPLE---

INSTRUCTIONS:
Write a brand-new, original passage in plain text only. DO NOT include any headings, notes, signatures, URLs, "Good luck", "Please let me know", or meta commentary. DO NOT reproduce or copy exact sentences from the sample. Invent new names, places and facts. Output only the passage — nothing else. 
Length target: Keep similar length as the INPUT Text (atleast 200 words).

Output starts after the next blank line:
"""

BATCH_SIZE = 1
MAX_NEW_TOKENS = 512
MIN_NEW_TOKENS = 220
MIN_WORDS = 120

N_RETRIES = 3
GEN_ARGS_BASE = dict(
    max_new_tokens=MAX_NEW_TOKENS,
    min_new_tokens=MIN_NEW_TOKENS,
    do_sample=True,
    temperature=0.7,
    top_p=0.9,
    top_k=50,
    repetition_penalty=1.15,
    no_repeat_ngram_size=3,
    use_cache=True,
    renormalize_logits=True, 

)

SAVE_INTERVAL_INITIAL = 5
SAVE_INTERVAL_REGULAR = 1000

def enable_flash_sdp():
    try:
        torch.backends.cuda.enable_flash_sdp(True)
    except Exception:
        pass

def clean_text(s: str) -> str:
    s = s.replace("\r", " ").replace("\t", " ")
    s = " ".join(s.split())
    s = re.sub(r'^[\s\.\,\-:;]+', '', s)
    return s.strip()

BLACKLIST_SUBSTRINGS = [
    "good luck", "please let me", "please note", "note:", "your name", "i am an ai",
    "©", "http://", "https://", "www.", "References:", "References", "End of Original",
    "All rights reserved"
]
PUNCT_ONLY = re.compile(r'^[\W_]+$')

def is_valid_output(decoded: str, src_sample: str):
    if not decoded:
        return False
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
    src_words = set(w.lower() for w in re.findall(r'\w+', src_sample)[:200])
    out_words = [w.lower() for w in re.findall(r'\w+', decoded)[:200]]
    if not out_words:
        return False
    shared = sum(1 for w in out_words if w in src_words)
    if shared / max(1, len(out_words)) > 0.30:
        return False
    return True

print("Enabling flash sdp (if available)...")
enable_flash_sdp()

print("Loading tokenizer and model (4-bit bnb config)...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.model_max_length = 4096

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

with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"Loaded {len(data)} items from {JSON_PATH}")

prompts = [PROMPT_TEMPLATE.format(text=item["text"]) for item in data]
ids = [item["id"] for item in data]

results = []
times = []
start_total = time.time()

for i in tqdm(range(30000, len(prompts), BATCH_SIZE), desc="Processing batches"):
    batch_prompts = prompts[i:i+BATCH_SIZE]
    batch_ids = ids[i:i+BATCH_SIZE]

    inputs = tokenizer(
        batch_prompts,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=tokenizer.model_max_length
    ).to(device)
    input_lengths = inputs["attention_mask"].sum(dim=1).to("cpu")

    start_batch = time.time()
    final_decoded = [None] * len(batch_prompts)

    for attempt in range(N_RETRIES):
        gen_args = GEN_ARGS_BASE.copy()
        if attempt > 0:
            gen_args["temperature"] = min(1.0, gen_args["temperature"] + 0.1 * attempt)
            gen_args["top_p"] = min(0.995, gen_args["top_p"] + 0.01 * attempt)

        try:
            with torch.no_grad():
                outputs = model.generate(**inputs, **gen_args)
        except RuntimeError as e:
            print("Generation runtime error:", str(e))
            torch.cuda.empty_cache()
            gen_args_sm = gen_args.copy()
            gen_args_sm["max_new_tokens"] = max(64, gen_args_sm["max_new_tokens"] // 2)
            try:
                with torch.no_grad():
                    outputs = model.generate(**inputs, **gen_args_sm)
            except Exception as e2:
                print("Retry failed:", e2)
                outputs = None

        if outputs is None:
            continue

        for b in range(len(batch_prompts)):
            inp_len = int(input_lengths[b].item())
            out_ids = outputs[b, inp_len:].cpu().tolist()
            decoded = tokenizer.decode(out_ids, skip_special_tokens=True).strip()
            decoded = clean_text(decoded)

            if is_valid_output(decoded, batch_prompts[b]):
                final_decoded[b] = decoded

        if all(x is not None for x in final_decoded):
            break

    end_batch = time.time()
    elapsed = end_batch - start_batch
    times.append(elapsed / len(batch_prompts))

    try:
        del inputs, outputs
    except Exception:
        pass
    torch.cuda.empty_cache()

    for j in range(len(batch_prompts)):
        out_text = final_decoded[j] or ""  
        results.append({
            "id": batch_ids[j],
            "elapsed_sec": elapsed / len(batch_prompts),
            "output": out_text
        })

    batch_idx = i // BATCH_SIZE + 1
    if batch_idx == (30000+ SAVE_INTERVAL_INITIAL) or (batch_idx > SAVE_INTERVAL_INITIAL and batch_idx % SAVE_INTERVAL_REGULAR == 0):
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
