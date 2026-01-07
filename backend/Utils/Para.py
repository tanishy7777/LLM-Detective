import re
from typing import Any, Dict, List

def split_paragraph(paragraph: str, max_words: int = 100):
    # Split paragraph into tokens (words and separators)
    tokens = re.split(r'(\s+|[.;\n])', paragraph)
    chunks = []
    current_chunk = []
    word_count = 0

    for token in tokens:
        # Count words only (ignore whitespace and punctuation)
        if re.match(r'\w+', token):
            word_count += 1

        current_chunk.append(token)

        # If chunk exceeds limit and we hit a stop token, split
        if word_count >= max_words and token in ['.', ';', '\n']:
            chunks.append(''.join(current_chunk).strip())
            current_chunk = []
            word_count = 0

    # Add remaining words if any
    if current_chunk:
        chunks.append(''.join(current_chunk).strip())

    return chunks

# --- Core Sentence Clubbing Function ---

def club_sentences_by_word_count(
    sentences_info: List[Dict[str, Any]], 
    min_count: int = 20
) -> List[Dict[str, Any]]:
    """
    Clubs multiple sentences together if the combined word count is less than 
    min_count, only stopping when the minimum is met or exceeded.

    :param sentences_info: List of dictionaries, each containing 'text' (str)
                           and 'words' (list of fitz word tuples).
    :param min_count: The minimum desired word count for a chunk.
    :return: List of finalized, clubbed sentence chunks.
    """
    if not sentences_info:
        return []

    final_chunks = []
    current_chunk = None

    for sentence_info in sentences_info:
        sentence_text = sentence_info['text']
        sentence_words = sentence_info['words']
        
        # Calculate current chunk's word count (assuming simple split is sufficient)
        current_word_count = len(current_chunk['text'].split()) if current_chunk else 0

        # If no chunk yet, start one.
        if current_chunk is None:
            current_chunk = {
                'text': sentence_text,
                'words': sentence_words
            }
        # If the current chunk is too small, try to club the new sentence into it.
        elif current_word_count < min_count:
            current_chunk['text'] += ' ' + sentence_text
            current_chunk['words'].extend(sentence_words)
        # If the current chunk is already big enough, finalize it and start a new one.
        else:
            final_chunks.append(current_chunk)
            current_chunk = {
                'text': sentence_text,
                'words': sentence_words
            }

    # Add the last pending chunk
    if current_chunk:
        final_chunks.append(current_chunk)
        
    return final_chunks
