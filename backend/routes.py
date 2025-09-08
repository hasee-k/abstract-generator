import io

import PyPDF2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from GemmaImplementation import (  # ✅ import from your new Gemma file
    generate_abstract_using_gemma, generate_answer_using_gemma)
from LEDImplementation import (SummaryResponse, extract_text_from_pdf_bytes,
                               generate_abstract_using_led)
from LlamaImplementation import (generate_abstract_using_llama,
                                 generate_answer_using_llama)

router = APIRouter()


# ------------------- LLaMA Endpoints -------------------

@router.post("/generate-abstract-llama/")
async def generate_abstract_llama(
    file: UploadFile = File(...),
    word_count: str = Form(...),
    style: str = Form(...)
):
    try:
        file_bytes = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "".join([page.extract_text() or "" for page in pdf_reader.pages])

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        abstract = generate_abstract_using_llama(text, word_count=word_count, style=style)
        return {"abstract": abstract}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.post("/llama-chat/")
async def llama_chat(file: UploadFile = File(...), question: str = Form(...)):
    try:
        file_bytes = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "".join([page.extract_text() or "" for page in pdf_reader.pages])

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        answer = generate_answer_using_llama(text, question)
        return {"answer": answer}
    except Exception as e:
        import traceback
        print("Error in /llama-chat/:", traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)


# ------------------- LED Endpoint -------------------

@router.post("/generate-abstract-led/", response_model=SummaryResponse)
async def generate_abstract_led(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    contents = await file.read()
    try:
        text = extract_text_from_pdf_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF text: {e}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from PDF")

    abstract, num_chunks = generate_abstract_using_led(text)
    return {"abstract": abstract, "chunks": num_chunks}


# ------------------- Gemma (Gemini) Endpoints -------------------

@router.post("/generate-abstract-gemma/")
async def generate_abstract_gemma(
    file: UploadFile = File(...),
    word_count: str = Form(...),
    style: str = Form(...)
):
    try:
        file_bytes = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "".join([page.extract_text() or "" for page in pdf_reader.pages])

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        abstract = generate_abstract_using_gemma(text, word_count=word_count, style=style)
        return {"abstract": abstract}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@router.post("/gemma-chat/")
async def gemma_chat(file: UploadFile = File(...), question: str = Form(...)):
    try:
        file_bytes = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = "".join([page.extract_text() or "" for page in pdf_reader.pages])

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        answer = generate_answer_using_gemma(text, question)
        return {"answer": answer}
    except Exception as e:
        import traceback
        print("Error in /gemma-chat/:", traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)
