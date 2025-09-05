

def generate_abstract_gemini(text):
    token = 7000
    overlap = 300
    chunks = [text[i:i+token] for i in range(0, len(text), token - overlap)]
    print("number of chunks:", len(chunks))
    results = []
    for chunk in chunks:
        results.append(extract_important_points_with_gemini(chunk))
    return summarize_text(results)


def extract_important_points_with_gemini(text):

   return "points"


def summarize_text(results):

    return "abstract"
