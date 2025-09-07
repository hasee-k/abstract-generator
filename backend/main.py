import io
import math
import os
from typing import List

import fitz  # PyMuPDF
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# CONFIG
MODEL_DIR = os.environ.get("MODEL_DIR", "/model")  # set to your model dir
#MODEL_DIR = "./model"  # set to your model dir
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_INPUT_TOKENS = 16384  # LED max
CHUNK_INPUT_TOKENS = 4096  # chunk size to process per forward pass
MAX_TARGET_TOKENS = 512
GEN_ARGS = dict(max_length=512, num_beams=4, early_stopping=True, no_repeat_ngram_size=3)

# Load model & tokenizer once
print("Loading tokenizer and model from:", MODEL_DIR)
tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_DIR).to(DEVICE)
model.eval()

# optional memory-savers
try:
    model.gradient_checkpointing_enable()
except Exception:
    pass

app = FastAPI(title="Paper Abstract Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummaryResponse(BaseModel):
    abstract: str
    chunks: int


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Extracts text from PDF bytes using PyMuPDF (fitz)."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    texts = []
    for page in doc:
        try:
            txt = page.get_text()
            if txt:
                texts.append(txt)
        except Exception:
            continue
    doc.close()
    return "\n".join(texts)


def chunk_text_by_tokens(text: str, tokenizer, chunk_size: int, stride: int = 256) -> List[str]:
    """
    Splits `text` into token-aware chunks using tokenizer.
    Returns list of text chunks (string) each of approx chunk_size tokens.
    Uses an overlap of `stride` tokens between chunks.
    """
    # tokenize once to token ids
    enc = tokenizer(text, add_special_tokens=False)
    ids = enc["input_ids"]
    n = len(ids)
    if n <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < n:
        end = min(start + chunk_size, n)
        chunk_ids = ids[start:end]
        chunk_text = tokenizer.decode(chunk_ids, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        chunks.append(chunk_text)
        if end == n:
            break
        start = end - stride  # overlap
    return chunks


def summarize_text(text: str) -> str:
    """
    Top-level summarization flow:
    1. chunk the document into manageable pieces
    2. summarize each chunk
    3. concatenate chunk summaries and summarize again to produce final abstract
    """
    # 1. chunk
    chunks = chunk_text_by_tokens(text, tokenizer, chunk_size=CHUNK_INPUT_TOKENS, stride=512)

    chunk_summaries = []
    for i, c in enumerate(chunks):
        # prepare input with prefix
        inp = "generate an abstract for this article: " + c
        inputs = tokenizer(inp, return_tensors="pt", truncation=True, max_length=CHUNK_INPUT_TOKENS).to(DEVICE)

        # LED expects global attention mask (1 at first token)
        if "global_attention_mask" not in inputs:
            ga = torch.zeros_like(inputs["input_ids"])  # (1, L)
            ga[:, 0] = 1
            inputs["global_attention_mask"] = ga

        # generate
        with torch.no_grad():
            out = model.generate(**inputs, **GEN_ARGS)
        summary = tokenizer.decode(out[0], skip_special_tokens=True)
        chunk_summaries.append(summary)

    # 2. aggregate
    if len(chunk_summaries) == 1:
        final_draft = chunk_summaries[0]
    else:
        combined = "\n".join(chunk_summaries)
        inp2 = "summarize: " + combined
        inputs2 = tokenizer(inp2, return_tensors="pt", truncation=True, max_length=MAX_INPUT_TOKENS).to(DEVICE)
        if "global_attention_mask" not in inputs2:
            ga = torch.zeros_like(inputs2["input_ids"])  # (1, L)
            ga[:, 0] = 1
            inputs2["global_attention_mask"] = ga
        with torch.no_grad():
            out2 = model.generate(**inputs2, **GEN_ARGS)
        final_draft = tokenizer.decode(out2[0], skip_special_tokens=True)

    return final_draft, len(chunks)


@app.post("/generate", response_model=SummaryResponse)
async def generate(file: UploadFile = File(...)):
    # only accept PDFs
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    try:
        text = extract_text_from_pdf_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    # optional: quick length check
    # If extremely long, we rely on chunking function

    abstract, num_chunks = summarize_text(text)

    return {"abstract": abstract, "chunks": num_chunks}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)