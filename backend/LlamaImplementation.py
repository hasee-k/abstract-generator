import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

hf_token = os.environ.get("HF_TOKEN")
if not hf_token:
    raise RuntimeError("HF_TOKEN environment variable not set.")

client = InferenceClient(token=hf_token)


def generate_abstract_using_llama(text,word_count=300, style="formal academic"):
    token = 7000
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points(chunk))

    return summarize_text(results, word_count, style)


def extract_important_points(text):
    prompt = f"Based on the following text, extract the important points:\n{text}"
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that helps extract important points from a research paper. These points will be then used to generate the abstract of the paper."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=600,
        temperature=0
    )
    return completion.choices[0].message.content


def summarize_text(results, word_count, style):
    points = "\n".join(results)
    prompt = (
        "I will provide you several points extracted from a research paper. Based on the following points, I want you to generate an abstract for this paper.\n"
        "GIVE THE ABSTRACT IN PLAIN TEXT\n"
        "****** Extracted Points***** \n"
        f"{points}\n"
        "Give only the abstract as the output.\n"
        f"The abstract should be approximately {word_count} words long and written in a {style} style.\n"
        "REMINDER: Give the output in plain text without any numbering or bullet points."
    )
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that helps write the abstract a standard research paper. An abstract is a concise, standalone summary of a research paper that highlights its purpose, methods, key findings, and conclusions, allowing readers to understand the study's significance without reading the full text. It should be a single, coherent paragraph, usually 150-300 words, written in plain language without jargon, and should not include references, citations, or information not present in the main paper."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=400,
        temperature=0
    )
    return completion.choices[0].message.content

def extract_important_points_for_user_question(text, question):
    prompt = f"Based on the following text, extract the important points:\n{text}"
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that helps extract important points from a research paper. These points will be then used to answer the user's question about {question} so that the user can better understand the paper."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=600,
        temperature=0
    )
    return completion.choices[0].message.content

def generate_answer_using_llama(text, question):
    token = 7000
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points_for_user_question(chunk, question))

    return generate_llama_answer(results, question)


def generate_llama_answer(results, question):
    points = "\n".join(results)
    prompt = (
        f"I will provide you several points extracted from a research paper. Based on the following points, I want you to generate an answer the user's question.\n"
        f"{points}\n"
        f"Question: {question}\n"
        "Answer in plain language without any numbering or bullet points."
    )
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "system", "content": "You answer questions about scientific papers."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=100,
        temperature=0
    )
    return completion.choices[0].message.content
