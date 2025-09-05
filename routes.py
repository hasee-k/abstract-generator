import io

import PyPDF2
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

from LlamaImplementation import generate_abstract

router = APIRouter()


@router.post("/generate-abstract/")
async def generate_abstract_api(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()


        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""


        if not text.strip():
            return JSONResponse({"error": "No readable text found in PDF"}, status_code=400)

        abstract = generate_abstract(text)


        return {"abstract": abstract}

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
