import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
load_dotenv()


client = InferenceClient(token=os.environ["HF_TOKEN"])


def generate_abstract(text):
    token = 7000
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points(chunk))

    return summarize_text(results)


def extract_important_points(text):
   prompt = f"Based on the following text, extract the important points:\n{text}"
   completion = client.chat.completions.create(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=150,
            temperature=0.7
        )
   return completion.choices[0].message.content


def summarize_text(results):
    prompt = f"Summarize the following text:\n{results}"
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "user", "content": prompt}
        ],
        max_tokens=150,
        temperature=0.7
    )
    return completion.choices[0].message.content
