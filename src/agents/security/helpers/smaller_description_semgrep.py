def extract_first_sentences(text: str, max_sentences: int = 2) -> str:
    if not text:
        return ""

    sentences = text.split(".")
    
    selected = [s.strip() for s in sentences if s.strip()][:max_sentences]

    if not selected:
        return ""

    return ". ".join(selected) + "."