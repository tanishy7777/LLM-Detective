# # import json, time

# # import torch
# # try:
# #     torch.backends.cuda.enable_flash_sdp(True)
# #     print("Using Flash Attention")
# # except Exception:
# #     pass
# #     print("Not Using Flash Attention")


# # from transformers import AutoTokenizer, AutoModelForCausalLM
# # from tqdm import tqdm
# # import os

# # MODEL_PATH = "meta-llama/Llama-2-7b-chat-hf"
# # JSON_PATH = "texts.json"
# # PROMPT_TEMPLATE = """
# # You are a helpful writer. Do NOT include headings like "Here's a new sample", do NOT add "Note:", and do NOT include references or URLs.
# # Given this sample of human writing, write a brand-new, realistic passage that matches the tone, style, and approximate length (~200-300 words) but is about a different topic. Do not rephrase the original or re-use facts.

# # Sample:
# # {text}

# # Your output should be plain text only (no headings, no 'Note', no extra meta text), about 200-300 words, and not mention the original sample.
# # """


# # SAVE_INTERVAL_INITIAL = 5     # Save after first 5 batches
# # SAVE_INTERVAL_REGULAR = 2000  # Save every 2000 batches afterward
# # SAVE_DIR = "checkpoints"
# # os.makedirs(SAVE_DIR, exist_ok=True)

# # print("Loading model...")
# # tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
# # tokenizer.pad_token = tokenizer.eos_token
# # tokenizer.model_max_length = 4096
# # model = AutoModelForCausalLM.from_pretrained(
# #     MODEL_PATH,
# #     torch_dtype=torch.bfloat16,
# #     device_map="auto",
# #     load_in_4bit=True,
# # )
# # model.eval()
# # print("Model loaded.")

# # with open(JSON_PATH, "r", encoding="utf-8") as f:
# #     data = json.load(f)

# # print(f"Loaded {len(data)} items from {JSON_PATH}")

# # start_total = time.time()
# # results = []
# # times = []

# # BATCH_SIZE = 1
# # CHECKPOINT_INTERVAL = 10_000
# # print(f"Using BATCH_SIZE = {BATCH_SIZE}...")

# # prompts = [PROMPT_TEMPLATE.format(text=item["text"]) for item in data]
# # ids = [item["id"] for item in data]
# # # -------------------- robust generation loop --------------------
# # MAX_NEW_TOKENS = 512
# # MIN_NEW_TOKENS = 150             # avoid trivially short outputs
# # N_RETRIES = 2                    # re-generate up to N times if output invalid

# # # Better sampling settings (feel free to tune)
# # GEN_ARGS = dict(
# #     max_new_tokens=MAX_NEW_TOKENS,
# #     min_new_tokens=MIN_NEW_TOKENS,
# #     do_sample=True,
# #     temperature=0.7,
# #     top_p=0.95,
# #     top_k=50,
# #     repetition_penalty=1.1,
# #     no_repeat_ngram_size=3,
# #     use_cache=True,
# # )

# # def clean_text(s: str) -> str:
# #     # basic cleanup: normalize whitespace and remove leading punctuation
# #     s = s.replace("\r", " ").replace("\t", " ")
# #     s = " ".join(s.split())
# #     # strip leading punctuation-only garbage
# #     import re
# #     s = re.sub(r'^[\s\.\,\-:;]+', '', s)
# #     return s.strip()

# # for i in tqdm(range(0, len(prompts), BATCH_SIZE), desc="Processing batches"):
# #     batch_prompts = prompts[i:i + BATCH_SIZE]
# #     batch_ids = ids[i:i + BATCH_SIZE]

# #     # Tokenize (padding=True ok) and compute per-sample input lengths
# #     inputs = tokenizer(
# #         batch_prompts,
# #         return_tensors="pt",
# #         padding=True,
# #         truncation=True,
# #         max_length=tokenizer.model_max_length
# #     ).to(model.device)

# #     input_lengths = inputs["attention_mask"].sum(dim=1).to("cpu")  # tensor of shape (batch,)
# #     start_batch = time.time()

# #     # Try generate + retry loop for short/garbled outputs
# #     final_decoded = [None] * len(batch_prompts)
# #     base_gen_args = GEN_ARGS.copy()
# #     for attempt in range(N_RETRIES + 1):
# #         with torch.no_grad():
# #             gen_args = base_gen_args.copy()
# #             outputs = model.generate(
# #                 **inputs,
# #                 **GEN_ARGS
# #             )   # outputs: (batch, seq_len_out)

# #         # For each sample, slice off the input tokens before decoding
# #         for b in range(len(batch_prompts)):
# #             inp_len = int(input_lengths[b].item())
# #             out_ids = outputs[b, inp_len:].cpu().tolist()
# #             decoded = tokenizer.decode(out_ids, skip_special_tokens=True).strip()
# #             decoded = clean_text(decoded)

# #             # Basic validity checks
# #             # - not empty
# #             # - has at least MIN_NEW_TOKENS//4 words (rough heuristic)
# #             # - not just a single punctuation
# #             if decoded and len(decoded) > 5 and len(decoded.split()) >= max(10, MIN_NEW_TOKENS // 10):
# #                 final_decoded[b] = decoded

# #         # If all batch items are valid, break; otherwise retry
# #         if all(x is not None for x in final_decoded):
# #             break
# #         else:
# #             # On retry, nudge sampling to be more creative (slightly higher temp)
# #             GEN_ARGS["temperature"] = min(1.0, GEN_ARGS.get("temperature", 0.7) + 0.15)
# #             GEN_ARGS["top_p"] = min(0.99, GEN_ARGS.get("top_p", 0.95) + 0.02)

# #     end_batch = time.time()
# #     elapsed = end_batch - start_batch
# #     times.append(elapsed / len(batch_prompts))

# #     # cleanup GPU memory of big tensors
# #     del inputs, outputs
# #     torch.cuda.empty_cache()

# #     for j in range(len(batch_prompts)):
# #         polished_text = final_decoded[j] or ""   # empty string if we couldn't produce a valid generation
# #         results.append({
# #             "id": batch_ids[j],
# #             "elapsed_sec": elapsed / len(batch_prompts),
# #             "output": polished_text
# #         })

# #     # --- existing checkpoint logic unchanged ---
# #     batch_idx = i // BATCH_SIZE + 1
# #     if batch_idx == SAVE_INTERVAL_INITIAL or (batch_idx > SAVE_INTERVAL_INITIAL and batch_idx % SAVE_INTERVAL_REGULAR == 0):
# #         save_path = os.path.join(SAVE_DIR, f"polished_outputs_batch_{batch_idx}.json")
# #         with open(save_path, "w", encoding="utf-8") as f:
# #             json.dump(results, f, ensure_ascii=False, indent=2)
# #         print(f"\nCheckpoint saved: {save_path} ({len(results)} items).")
# # # -------------------- end loop --------------------

# # total_time = time.time() - start_total
# # print("\n--- Benchmark Summary ---")
# # print(f"Total time: {total_time:.2f}s")
# # if times:
# #     print(f"Avg per prompt: {sum(times)/len(times):.2f}s")
# #     print(f"Throughput: {len(data)/total_time:.2f} prompts/sec")

# # with open("polished_outputs_final.json", "w", encoding="utf-8") as f:
# #     json.dump(results, f, ensure_ascii=False, indent=2)

# # print("Done. Final results saved to polished_outputs_final.json")


# # fixed_run_inference.py
# import os, json, time, re, torch
# from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
# from tqdm import tqdm

# # ---------------- Config ----------------
# # MODEL_PATH = "mistralai/Mistral-7B-Instruct-v0.3"
# MODEL_PATH = "mistralai/Mistral-7B-Instruct-v0.3"
# JSON_PATH = "texts.json"
# SAVE_DIR = "checkpoints"
# os.makedirs(SAVE_DIR, exist_ok=True)

# # prompt: explicit sentinel and strong "only output" instruction
# PROMPT_TEMPLATE = """
# ---BEGIN SAMPLE---
# {text}
# ---END SAMPLE---

# INSTRUCTIONS:
# Write a brand-new, original passage in plain text only. DO NOT include any headings, notes, signatures, URLs, "Good luck", "Please let me know", or meta commentary. DO NOT reproduce or copy exact sentences from the sample. Invent new names, places and facts. Output only the passage — nothing else. 

# Length target: about 200-300 words.

# Output starts after the next blank line:
# """

# # batch / generation params
# BATCH_SIZE = 1
# MAX_NEW_TOKENS = 512
# # roughly ~200-300 words ≈ 250-350 tokens depending; lower bound tokens:
# MIN_NEW_TOKENS = 220
# MIN_WORDS = 120

# N_RETRIES = 3
# GEN_ARGS_BASE = dict(
#     max_new_tokens=MAX_NEW_TOKENS,
#     min_new_tokens=MIN_NEW_TOKENS,
#     do_sample=True,
#     temperature=0.75,
#     top_p=0.95,
#     top_k=50,
#     repetition_penalty=1.15,
#     no_repeat_ngram_size=3,
#     use_cache=True,
# )

# SAVE_INTERVAL_INITIAL = 5
# SAVE_INTERVAL_REGULAR = 100

# # ---------------- Helpers ----------------
# def enable_flash_sdp():
#     try:
#         torch.backends.cuda.enable_flash_sdp(True)
#     except Exception:
#         pass

# def clean_text(s: str) -> str:
#     s = s.replace("\r", " ").replace("\t", " ")
#     s = " ".join(s.split())
#     s = re.sub(r'^[\s\.\,\-:;]+', '', s)
#     return s.strip()

# # blacklist heuristics (if any substring present -> reject)
# BLACKLIST_SUBSTRINGS = [
#     "good luck", "please let me", "please note", "note:", "your name", "i am an ai",
#     "©", "http://", "https://", "www.", "References:", "References", "End of Original",
#     "All rights reserved"
# ]
# # pattern to detect short garbage (only punctuation, emojis)
# PUNCT_ONLY = re.compile(r'^[\W_]+$')

# def is_valid_output(decoded: str, src_sample: str):
#     if not decoded:
#         return False
#     # length checks
#     if len(decoded.split()) < MIN_WORDS:
#         return False
#     if len(decoded) < 30:
#         return False
#     # blacklist
#     low = decoded.lower()
#     for bad in BLACKLIST_SUBSTRINGS:
#         if bad in low:
#             return False
#     if PUNCT_ONLY.match(decoded):
#         return False
#     # avoid echoing original: simple fuzzy check - if more than 30% tokens are shared, reject
#     # src_words = set(w.lower() for w in re.findall(r'\w+', src_sample)[:200])
#     # out_words = [w.lower() for w in re.findall(r'\w+', decoded)[:200]]
#     # if not out_words:
#     #     return False
#     # shared = sum(1 for w in out_words if w in src_words)
#     # if shared / max(1, len(out_words)) > 0.30:
#     #     return False
#     return True

# # ---------------- Setup model ----------------
# print("Enabling flash sdp (if available)...")
# enable_flash_sdp()

# print("Loading tokenizer and model (4-bit bnb config)...")
# tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
# tokenizer.pad_token = tokenizer.eos_token
# tokenizer.model_max_length = 4096

# bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
# model = AutoModelForCausalLM.from_pretrained(
#     MODEL_PATH,
#     quantization_config=bnb_config,
#     device_map="auto",
#     trust_remote_code=False,
#     low_cpu_mem_usage=True
# )
# model.eval()
# device = next(model.parameters()).device
# print("Model loaded on", device)

# # ---------------- Load data ----------------
# with open(JSON_PATH, "r", encoding="utf-8") as f:
#     data = json.load(f)
# print(f"Loaded {len(data)} items from {JSON_PATH}")



# def truncate_text(text, max_words=40):
#     """Return the first sentence or up to max_words words."""
#     text = text.strip()
#     # Split into sentences
#     sentences = re.split(r'(?<=[.!?])\s+', text)
#     if sentences:
#         first_sentence = sentences[0]
#     else:
#         first_sentence = text

#     # If the first sentence is very short (<10 words), extend up to max_words
#     words = first_sentence.split()
#     if len(words) < 10:
#         words = text.split()[:max_words]
#         first_sentence = " ".join(words)

#     return first_sentence.strip()

# # build truncated prompts
# prompts = [PROMPT_TEMPLATE.format(text=truncate_text(item["text"])) for item in data]
# ids = [item["id"] for item in data]

# results = []
# times = []
# start_total = time.time()

# # ---------------- Generation loop ----------------
# for i in tqdm(range(0, len(prompts), BATCH_SIZE), desc="Processing batches"):
#     batch_prompts = prompts[i:i+BATCH_SIZE]
#     batch_ids = ids[i:i+BATCH_SIZE]

#     # tokenize
#     inputs = tokenizer(
#         batch_prompts,
#         return_tensors="pt",
#         padding=True,
#         truncation=True,
#         max_length=tokenizer.model_max_length
#     ).to(device)
#     input_lengths = inputs["attention_mask"].sum(dim=1).to("cpu")

#     start_batch = time.time()
#     final_decoded = [None] * len(batch_prompts)

#     for attempt in range(N_RETRIES):
#         # copy base args so we don't mutate for next attempt/batch
#         gen_args = GEN_ARGS_BASE.copy()
#         # nudge on later attempts to increase diversity
#         if attempt > 0:
#             gen_args["temperature"] = min(1.0, gen_args["temperature"] + 0.1 * attempt)
#             gen_args["top_p"] = min(0.995, gen_args["top_p"] + 0.01 * attempt)

#         try:
#             with torch.no_grad():
#                 outputs = model.generate(**inputs, **gen_args)
#         except RuntimeError as e:
#             # handle OOM or transient error: try a smaller generation
#             print("Generation runtime error:", str(e))
#             torch.cuda.empty_cache()
#             gen_args_sm = gen_args.copy()
#             gen_args_sm["max_new_tokens"] = max(64, gen_args_sm["max_new_tokens"] // 2)
#             try:
#                 with torch.no_grad():
#                     outputs = model.generate(**inputs, **gen_args_sm)
#             except Exception as e2:
#                 print("Retry failed:", e2)
#                 outputs = None

#         if outputs is None:
#             continue

#         # evaluate each sample in batch
#         for b in range(len(batch_prompts)):
#             inp_len = int(input_lengths[b].item())
#             out_ids = outputs[b, inp_len:].cpu().tolist()
#             decoded = tokenizer.decode(out_ids, skip_special_tokens=True).strip()
#             decoded = clean_text(decoded)

#             # check validity against original sample text
#             if is_valid_output(decoded, batch_prompts[b]):
#                 final_decoded[b] = decoded

#         # if all valid, break early
#         if all(x is not None for x in final_decoded):
#             break

#     # after N_RETRIES, accept valid ones, else save empty string
#     end_batch = time.time()
#     elapsed = end_batch - start_batch
#     times.append(elapsed / len(batch_prompts))

#     # free memory
#     try:
#         del inputs, outputs
#     except Exception:
#         pass
#     torch.cuda.empty_cache()

#     # append results
#     for j in range(len(batch_prompts)):
#         out_text = final_decoded[j] or ""   # empty if generation failed validity checks
#         results.append({
#             "id": batch_ids[j],
#             "elapsed_sec": elapsed / len(batch_prompts),
#             "output": out_text
#         })

#     # periodic checkpointing
#     batch_idx = i // BATCH_SIZE + 1
#     if batch_idx == SAVE_INTERVAL_INITIAL or (batch_idx > SAVE_INTERVAL_INITIAL and batch_idx % SAVE_INTERVAL_REGULAR == 0):
#         save_path = os.path.join(SAVE_DIR, f"polished_outputs_batch_{batch_idx}.json")
#         with open(save_path, "w", encoding="utf-8") as f:
#             json.dump(results, f, ensure_ascii=False, indent=2)
#         print(f"\nCheckpoint saved: {save_path} ({len(results)} items).")

# # final save
# total_time = time.time() - start_total
# print("\n--- Benchmark Summary ---")
# print(f"Total time: {total_time:.2f}s")
# if times:
#     print(f"Avg per prompt: {sum(times)/len(times):.2f}s")
#     print(f"Throughput: {len(data)/total_time:.2f} prompts/sec")

# with open("polished_outputs_final.json", "w", encoding="utf-8") as f:
#     json.dump(results, f, ensure_ascii=False, indent=2)

# print("Done. Final results saved to polished_outputs_final.json")
