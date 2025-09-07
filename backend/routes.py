import io

import PyPDF2
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from LEDImplementation import (SummaryResponse, extract_text_from_pdf_bytes,
                               generate_abstract_using_led)
from LlamaImplementation import (generate_abstract_using_llama,
                                 generate_answer_using_led)

router = APIRouter()


@router.post("/generate-abstract-llama/")
async def generate_abstract_llama(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        abstract = generate_abstract_using_llama(text)

        return {"abstract": abstract}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)



@router.post("/generate-abstract-led/", response_model=SummaryResponse)
async def generate_abstract_led(file: UploadFile = File(...)):
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

    abstract, num_chunks = generate_abstract_using_led(text)

    return {"abstract": abstract, "chunks": num_chunks}


@router.post("/llama-chat/")
async def llama_chat(file: UploadFile = File(...), question: str = Form(...)):
    try:
        file_bytes = await file.read()

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""

        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)
        answer = generate_answer_using_led(text, question)
        return {"answer": answer}
    except Exception as e:
        import traceback
        print("Error in /llama-chat/:", traceback.format_exc())
        return JSONResponse({"error": str(e)}, status_code=500)