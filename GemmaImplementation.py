import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
genai.configure(api_key=os.environ["GEMMA_API_KEY"])

# ✅ Select a supported model (pick one from your list)
MODEL_NAME = "models/gemma-3-4b-it"  

model = genai.GenerativeModel(MODEL_NAME)

def generate_abstract(text):
    token = 6000  # use smaller chunks for safety
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points(chunk))

    return summarize_text(results)


def extract_important_points(text):
    prompt = f"Based on the following text, extract the important points:\n{text}"
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.7,
            "max_output_tokens": 800
        }
    )
    return response.text


def summarize_text(results):
    prompt = (f"I will provide you several points extracted from a research paper. "
              f"Based on the following points, generate an abstract.\n"
              f"****** Extracted Points ***** \n{results}\n"
              f"Give only the abstract as plain text.")
    
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.4,
            "max_output_tokens": 400
        }
    )
    return response.text
