import base64
from collections import defaultdict
import os
import pickle
from typing import List, Set, Dict, Tuple
from dataclasses import dataclass
import hashlib
from pathlib import Path
import re

import fitz
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.lib.colors import yellow, red, orange, HexColor

from Tesseract.OCR import ocr_from_base64


CACHE_DIR = Path("plagiarism_cache")
CACHE_DIR.mkdir(exist_ok=True)
DOC_REP_FILE = CACHE_DIR / "doc_reps.pkl"
SHINGLE_SIZE = 5
MIN_TOKEN_LEN = 2

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> List:
    tokens = [t for t in text.split() if len(t) >= MIN_TOKEN_LEN]
    return tokens


def shingles_from_tokens(tokens: List[str], k: int) -> Set:
    if k <= 0:
        return set()
    out = set()
    for i in range(max(0, len(tokens) - k + 1)):
        sh = " ".join(tokens[i : i + k])
        h = hashlib.sha1(sh.encode("utf-8")).hexdigest()
        out.add(h)
    return out


def shingles_from_tokens_with_positions(tokens: List[str], k: int) -> Dict[str, List[int]]:
    """Returns dict of shingle_hash -> list of starting token positions"""
    if k <= 0:
        return {}
    out = defaultdict(list)
    for i in range(max(0, len(tokens) - k + 1)):
        sh = " ".join(tokens[i : i + k])
        h = hashlib.sha1(sh.encode("utf-8")).hexdigest()
        out[h].append(i)
    return dict(out)


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    inter = len(set_a & set_b)
    union = len(set_a | set_b)
    return inter / union


@dataclass
class DocRepresentation:
    doc_id: str
    path: str
    shingles: Set[str]
    token_count: int
    raw_text_excerpt: str
    full_text: str = ""  # Store full text for visualization
    tokens: List[str] = None  # Store tokens for position mapping
    

def extract_text_and_ocr_from_pdf(path: str) -> str:
    texts = []
    doc = fitz.open(path)
    for page in doc:
        page_text = page.get_text("text") or ""
        texts.append(page_text)

        image_list = page.get_images(full=True)
        if image_list:
            for img_meta in image_list:
                xref = img_meta[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                b64 = base64.b64encode(image_bytes).decode("utf-8")
                try:
                    ocr_text = ocr_from_base64(b64)
                    if ocr_text.strip():
                        texts.append(ocr_text)
                except Exception as e:
                    print(f"[WARN] OCR failed on image in {path}: {e}")

    doc.close()
    return "\n".join(texts)


def load_cached_representations() -> Dict[str, DocRepresentation]:
    if DOC_REP_FILE.exists():
        with open(DOC_REP_FILE, "rb") as f:
            return pickle.load(f)
    return {}


def save_cached_representations(reps: Dict[str, DocRepresentation]):
    with open(DOC_REP_FILE, "wb") as f:
        pickle.dump(reps, f)


class PlagiarismVisualizer:
    def __init__(self, shingle_size: int = SHINGLE_SIZE):
        self.shingle_size = shingle_size
        self.reps: Dict[str, DocRepresentation] = load_cached_representations()
        self.shingle_index: Dict[str, Set[str]] = defaultdict(set)
        for doc_id, rep in self.reps.items():
            for sh in rep.shingles:
                self.shingle_index[sh].add(doc_id)

    def _make_doc_id(self, path: str) -> str:
        st = os.stat(path)
        hasher = hashlib.sha1()
        hasher.update(str(path).encode("utf-8"))
        hasher.update(str(st.st_size).encode("utf-8"))
        hasher.update(str(int(st.st_mtime)).encode("utf-8"))
        return hasher.hexdigest()

    def process_document(self, path: str) -> str:
        """Process document and return doc_id"""
        path = str(path)
        doc_id = self._make_doc_id(path)
        
        if doc_id in self.reps:
            return doc_id

        print(f"[INFO] Processing: {path}")
        full_text = extract_text_and_ocr_from_pdf(path)
        norm = normalize_text(full_text)
        tokens = tokenize(norm)
        shingles = shingles_from_tokens(tokens, self.shingle_size)
        excerpt = (full_text[:400] + "...") if len(full_text) > 400 else full_text

        rep = DocRepresentation(
            doc_id=doc_id,
            path=path,
            shingles=shingles,
            token_count=len(tokens),
            raw_text_excerpt=excerpt,
            full_text=full_text,
            tokens=tokens
        )
        
        self.reps[doc_id] = rep
        for sh in shingles:
            self.shingle_index[sh].add(doc_id)
        save_cached_representations(self.reps)
        return doc_id

    def find_matching_positions(self, doc_id_a: str, doc_id_b: str) -> Tuple[Set[int], Set[int]]:
        """Find token positions that match between two documents"""
        rep_a = self.reps[doc_id_a]
        rep_b = self.reps[doc_id_b]
        
        # Get shingle positions for both documents
        shingles_a = shingles_from_tokens_with_positions(rep_a.tokens, self.shingle_size)
        shingles_b = shingles_from_tokens_with_positions(rep_b.tokens, self.shingle_size)
        
        # Find common shingles
        common_shingles = set(shingles_a.keys()) & set(shingles_b.keys())
        
        # Collect all matching token positions
        positions_a = set()
        positions_b = set()
        
        for shingle in common_shingles:
            for pos in shingles_a[shingle]:
                # Mark all tokens in this shingle
                for i in range(self.shingle_size):
                    positions_a.add(pos + i)
            for pos in shingles_b[shingle]:
                for i in range(self.shingle_size):
                    positions_b.add(pos + i)
        
        return positions_a, positions_b

    def create_highlighted_pdf(self, doc_id: str, matching_positions: Set[int], 
                               compared_doc_path: str, similarity: float, 
                               output_path: str):
        """Create a PDF with highlighted matching segments"""
        rep = self.reps[doc_id]
        
        # Create PDF
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=HexColor('#1a1a1a'),
            spaceAfter=30
        )
        story.append(Paragraph(f"Plagiarism Analysis Report", title_style))
        story.append(Spacer(1, 12))
        
        # Document info
        info_style = styles['Normal']
        story.append(Paragraph(f"<b>Document:</b> {os.path.basename(rep.path)}", info_style))
        story.append(Paragraph(f"<b>Compared with:</b> {os.path.basename(compared_doc_path)}", info_style))
        story.append(Paragraph(f"<b>Similarity Score:</b> {similarity:.2%}", info_style))
        story.append(Paragraph(f"<b>Matching Tokens:</b> {len(matching_positions)} / {rep.token_count}", info_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph("<b>Highlighted Text:</b>", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        # Create highlighted text
        highlight_style = ParagraphStyle(
            'Highlighted',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_JUSTIFY,
            leading=14
        )
        
        # Build highlighted text
        highlighted_parts = []
        tokens = rep.tokens
        
        i = 0
        while i < len(tokens):
            if i in matching_positions:
                # Start of a matching segment
                segment = []
                while i < len(tokens) and i in matching_positions:
                    segment.append(tokens[i])
                    i += 1
                # Highlight this segment
                highlighted_parts.append(f'<font backColor="yellow"><b>{" ".join(segment)}</b></font>')
            else:
                # Non-matching segment
                segment = []
                while i < len(tokens) and i not in matching_positions:
                    segment.append(tokens[i])
                    i += 1
                highlighted_parts.append(" ".join(segment))
        
        full_highlighted_text = " ".join(highlighted_parts)
        
        # Split into chunks to avoid reportlab issues with very long paragraphs
        max_chunk_size = 3000
        text_chunks = []
        current_chunk = ""
        
        words = full_highlighted_text.split()
        for word in words:
            if len(current_chunk) + len(word) + 1 > max_chunk_size:
                text_chunks.append(current_chunk)
                current_chunk = word
            else:
                current_chunk += " " + word if current_chunk else word
        
        if current_chunk:
            text_chunks.append(current_chunk)
        
        for chunk in text_chunks:
            story.append(Paragraph(chunk, highlight_style))
            story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
        print(f"[INFO] Created highlighted PDF: {output_path}")

    def compare_and_visualize(self, path_a: str, path_b: str, output_dir: str = "visualizations"):
        """Compare two documents and create highlighted PDFs for both"""
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)
        
        # Process both documents
        doc_id_a = self.process_document(path_a)
        doc_id_b = self.process_document(path_b)
        
        # Calculate similarity
        rep_a = self.reps[doc_id_a]
        rep_b = self.reps[doc_id_b]
        similarity = jaccard_similarity(rep_a.shingles, rep_b.shingles)
        
        print(f"\n[INFO] Similarity between documents: {similarity:.2%}")
        
        # Find matching positions
        positions_a, positions_b = self.find_matching_positions(doc_id_a, doc_id_b)
        
        # Create output filenames
        base_a = Path(path_a).stem
        base_b = Path(path_b).stem
        output_a = output_dir / f"{base_a}_vs_{base_b}_highlighted.pdf"
        output_b = output_dir / f"{base_b}_vs_{base_a}_highlighted.pdf"
        
        # Create highlighted PDFs
        self.create_highlighted_pdf(doc_id_a, positions_a, path_b, similarity, str(output_a))
        self.create_highlighted_pdf(doc_id_b, positions_b, path_a, similarity, str(output_b))
        
        return similarity, str(output_a), str(output_b)


# Example usage
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Visualize plagiarism matches between PDFs")
    parser.add_argument("pdf1", help="First PDF file")
    parser.add_argument("pdf2", help="Second PDF file")
    parser.add_argument("--shingle", type=int, default=SHINGLE_SIZE, help="shingle size")
    parser.add_argument("--output-dir", default="visualizations", help="Output directory")
    args = parser.parse_args()

    visualizer = PlagiarismVisualizer(shingle_size=args.shingle)
    similarity, out_a, out_b = visualizer.compare_and_visualize(
        args.pdf1, 
        args.pdf2, 
        args.output_dir
    )
    
    print(f"\n✓ Visualization complete!")
    print(f"  Similarity: {similarity:.2%}")
    print(f"  Output 1: {out_a}")
    print(f"  Output 2: {out_b}")