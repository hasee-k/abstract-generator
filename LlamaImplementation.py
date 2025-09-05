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
                {"role": "system", "content": "You are a helpful assistant that helps extract important points from a research paper. "
                                              "These points will be then used to generate the abstract of the paper."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=600,
            temperature=0.7
        )
   return completion.choices[0].message.content


def summarize_text(results):
    prompt = (f"I will provide you several points extracted from a research paper. Based on the following points, i want you to generate an abstract for this paper."
              f"GIVE THE ABSTRACT IN PLAIN TEXT"
              f"****** Extracted Points***** \n{results}"
              f"Give only the abstract as the output."
              f"REMINDER:Give the output in plain text without any numbering or bullet points.")
    completion = client.chat.completions.create(
        model="meta-llama/Meta-Llama-3-8B-Instruct",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that helps write the abstract a standard research paper.An abstract is a concise, standalone summary of a research paper that highlights its purpose, methods, key findings, and conclusions, allowing readers to understand the study's significance without reading the full text. It should be a single, coherent paragraph, usually 150-300 words, written in plain language without jargon, and should not include references, citations, or information not present in the main paper."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,
        temperature=0.4
    )
    return completion.choices[0].message.content
