import io
import random
import re
from typing import Any, Dict, List, Tuple
import fitz  # PyMuPDF
from opentelemetry.trace import Tracer

from Utils.Group import GroupPara
from Utils.Request import GetClass
from Utils.CONFIG import COLOR_MAP
from Utils.Para import club_sentences_by_word_count


def highlight_sentences(pdf_input, pdf_output, highlights):
    """
    Highlights sentences in a PDF with different colors.

    Args:
        pdf_input (str): Path to the input PDF.
        pdf_output (str): Path to save the highlighted PDF.
        highlights (list of tuples): Each tuple is (sentence, color),
                                     color as (R,G,B), values 0-1
                                     Example: ("Python", (1,0,0)) -> red
    """
    doc = fitz.open(pdf_input)

    for page in doc:
        text_instances = page.search_for("")  # initialize

        for sentence, color in highlights:
            matches = page.search_for(sentence)
            for inst in matches:
                # highlight rectangle with the given color
                highlight = page.add_highlight_annot(inst)
                highlight.set_colors(stroke=color)
                highlight.update()

    doc.save(pdf_output)
    print(f"✅ Saved highlighted PDF to {pdf_output}")


def highlight_paragraphs(pdf_bytes: bytes) -> bytes:
    # Load PDF from bytes
    doc = fitz.open("pdf", pdf_bytes)
    colors = [
        (1, 1, 0),   # yellow
        (0, 1, 1),   # cyan
        (1, 0.6, 0),  # orange
        (0.7, 0.9, 0.2)  # lime
    ]

    for page in doc:
        blocks = page.get_text("blocks")
        chosen = [b for b in blocks if b[4].strip()]

        if not chosen:
            continue

        for i, para in enumerate(chosen):
            x0, y0, x1, y1, *_ = para
            highlight = page.add_highlight_annot(fitz.Rect(x0, y0, x1, y1))
            highlight.set_colors(stroke=colors[i % len(colors)])
            highlight.update()

    output_stream = io.BytesIO()
    doc.save(output_stream)
    doc.close()

    return output_stream.getvalue()


async def HighlightParagraphs(pdf_bytes: bytes, tracer: Tracer = None) -> bytes:
    # Load PDF from bytes
    doc = fitz.open("pdf", pdf_bytes)
    color_map = [
        (0.6, 1.0, 0.6),   # #99FF99 - Light Green - Humanise
        (0.6, 0.6, 1.0),   # #9999FF - Light Blue - Polished
        (1.0, 0.6, 0.6),   # #FF9999 - Light Red - AI
        (1.0, 1.0, 0.6),   # #FFFF99 - Light Yellow - Humanised
        (1.0, 1.0, 1.0),   # #FFFFFF - Light (default) - Undetermined
    ]

    data = []
    for page in doc:
        blocks = page.get_text("blocks")
        chosen = [b for b in blocks if b[4].strip()]

        if not chosen:
            continue

        grouped, paragraphs = GroupPara(chosen, minCount=0)

        if len(paragraphs) == 0:
            continue

        for j, p in enumerate(paragraphs):
            class_name = await GetClass(p)
            data.append((p, class_name[0], class_name[1]))
            # print("\n'" + class_name + "'")
            # Just to simulate async call per paragraph
            for _, para in enumerate(grouped[j]):
                x0, y0, x1, y1, *_ = para
                highlight = page.add_highlight_annot(fitz.Rect(x0, y0, x1, y1))
                highlight.set_colors(
                    stroke=color_map[int(class_name[0]) % len(color_map)]
                )
                highlight.update()

    output_stream = io.BytesIO()
    doc.save(output_stream)
    doc.close()

    return output_stream.getvalue(), data

# --- Main Highlighting Function ---

async def HighlightSentences(
    pdf_bytes: bytes, 
    min_count: int = 20, 
    tracer: Tracer = None
) -> Tuple[bytes, List[Tuple[str, int, float]]]:
    """
    Highlights and underlines the text in a PDF sentence by sentence, 
    clubbing sentences to meet a minimum word count.

    :param pdf_bytes: The byte content of the PDF file.
    :param min_count: The minimum word count required for a sentence segment.
    :param tracer: Optional tracer object (stubbed).
    :return: A tuple containing the modified PDF bytes and a list of 
             (text, class_index, score) classifications.
    """
    doc = fitz.open("pdf", pdf_bytes)
    output_data = []

    for page_index, page in enumerate(doc):
        # 1. Get all words with their bounding boxes
        # (x0, y0, x1, y1, word, block_no, line_no, word_no)
        words: List[Tuple[float, float, float, float, str, int, int, int]] = page.get_text("words")

        if not words:
            continue

        full_page_text = ' '.join(w[4] for w in words)
        
        # 2. Simple Sentence Tokenization (non-robust, depends on standard punctuation/spacing)
        # Split by typical sentence-ending punctuation followed by whitespace.
        raw_sentences = re.split(r'(?<=[.!?])\s+', full_page_text.strip())
        
        # 3. Map sentences back to their constituent words and bounding boxes
        sentences_info: List[Dict[str, Any]] = []
        word_index = 0
        
        for raw_sentence in raw_sentences:
            if not raw_sentence.strip():
                continue
                
            sentence_words_tuples = []
            sentence_text_parts = raw_sentence.split()
            
            # Find the words in the global word list that make up this sentence
            for part in sentence_text_parts:
                # Simple matching: find the next word in the global list that matches the part
                # This assumes no words are duplicated immediately or skipped.
                if word_index < len(words) and words[word_index][4].strip() == part.strip():
                    sentence_words_tuples.append(words[word_index])
                    word_index += 1
                else:
                    # Fallback for more complex tokenization issues/missing words
                    # If the full_page_text contains merged words that the simple splitter 
                    # can't handle, we might skip a word. We'll skip this whole sentence.
                    print(f"Warning: Failed to match word part '{part}' at index {word_index}. Skipping sentence.")
                    sentence_words_tuples = []
                    break
            
            if sentence_words_tuples:
                sentences_info.append({
                    'text': raw_sentence.strip(),
                    'words': sentence_words_tuples
                })
        
        # 4. Club Sentences
        clubbed_chunks = club_sentences_by_word_count(sentences_info, min_count)

        # 5. Classify and Annotate each chunk
        for chunk in clubbed_chunks:
            chunk_text = chunk['text']
            chunk_words = chunk['words']
            
            # Call async function to classify the chunk
            class_index, class_score = await GetClass(chunk_text)
            output_data.append((chunk_text, class_index, class_score))

            # Determine the color
            color = COLOR_MAP[class_index % len(COLOR_MAP)]

            # Calculate the overall bounding box for the chunk
            # The word tuples are (x0, y0, x1, y1, ...)
            min_x0 = min(w[0] for w in chunk_words)
            min_y0 = min(w[1] for w in chunk_words)
            max_x1 = max(w[2] for w in chunk_words)
            max_y1 = max(w[3] for w in chunk_words)
            
            rect = fitz.Rect(min_x0, min_y0, max_x1, max_y1)

            # Apply Underline Annotation (as requested)
            underline = page.add_underline_annot(rect)
            underline.set_colors(stroke=color)
            underline.update()
            
            # Apply Highlight Annotation (to provide the color coding)
            highlight = page.add_highlight_annot(rect)
            highlight.set_colors(stroke=color)
            highlight.update()


    # 6. Save the modified PDF
    output_stream = io.BytesIO()
    doc.save(output_stream)
    doc.close()

    return output_stream.getvalue(), output_data

if __name__ == "__main__":
    # --- Example Usage ---
    highlights = [
        ("Pablo  Neruda", (1, 0, 0)),          # red
        ("Now we will count to twelve", (0, 1, 0)),       # green
        ("What I want should not be", (0, 0, 1)),             # blue
    ]

    highlight_sentences("./Test/Data/XMLtest.pdf",
                        "./Test/Data/XMLtesthighlighted.pdf", highlights)
