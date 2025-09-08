import os

import google.generativeai as genai
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
genai.configure(api_key=os.environ["GEMMA_API_KEY"])

# Choose model
MODEL_NAME = "models/gemma-3-4b-it"
model = genai.GenerativeModel(MODEL_NAME)


def generate_abstract_using_gemma(text, word_count=300, style="formal academic"):
    token = 6000  # chunk size for safety
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points(chunk))

    return summarize_text(results, word_count, style)


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


def summarize_text(results, word_count, style):
    points = "\n".join(results)
    prompt = (
        "I will provide you several points extracted from a research paper. "
        "Based on the following points, I want you to generate an abstract for this paper.\n"
        "GIVE THE ABSTRACT IN PLAIN TEXT\n"
        "****** Extracted Points ***** \n"
        f"{points}\n"
        "Give only the abstract as the output.\n"
        f"The abstract should be approximately {word_count} words long and written in a {style} style.\n"
        "REMINDER: The abstract must be a single coherent paragraph without bullet points."
    )

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.4,
            "max_output_tokens": 500
        }
    )
    return response.text


# ---------- Q&A pipeline ----------

def extract_important_points_for_user_question(text, question):
    prompt = (
        f"Based on the following text, extract the important points that will help answer the user's question.\n"
        f"Question: {question}\n"
        f"Text:\n{text}"
    )
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.7,
            "max_output_tokens": 800
        }
    )
    return response.text


def generate_answer_using_gemma(text, question):
    token = 6000
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points_for_user_question(chunk, question))

    return generate_gemma_answer(results, question)


def generate_gemma_answer(results, question):
    points = "\n".join(results)
    prompt = (
        f"I will provide you several points extracted from a research paper. "
        f"Based on the following points, generate an answer to the user's question.\n"
        f"{points}\n"
        f"Question: {question}\n"
        "Answer in plain language without bullet points."
    )
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.4,
            "max_output_tokens": 300
        }
    )
    return response.text
