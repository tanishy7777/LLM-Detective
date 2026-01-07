# PDF Plagiarism Checker Documentation

## Overview

This plagiarism detection system analyzes PDF documents by extracting text (including OCR from embedded images) and comparing them using shingling and Jaccard similarity. It features persistent caching to avoid reprocessing documents.

## Features

- **Single-pass processing**: Extracts both regular text and OCR text from images in one pass
- **Persistent caching**: Stores processed document representations to avoid recomputation
- **Shingling algorithm**: Uses n-gram token hashing for efficient similarity detection
- **Jaccard similarity**: Compares document overlap using set-based metrics

## Installation Requirements

```python
# Required packages
fitz  # PyMuPDF for PDF processing
# Custom OCR module (Tesseract.OCR)
```

## Configuration

### Global Constants

- `CACHE_DIR`: Directory for storing cached representations (default: `plagiarism_cache`)
- `DOC_REP_FILE`: Pickle file storing document representations
- `SHINGLE_SIZE`: N-gram size for shingling (default: 5)
- `MIN_TOKEN_LEN`: Minimum token length to consider (default: 2)

## Core Components

### Text Processing Functions

#### `normalize_text(text: str) -> str`

Normalizes text for comparison by:

- Converting to lowercase
- Removing non-alphanumeric characters (except spaces)
- Collapsing multiple whitespaces

#### `tokenize(text: str) -> List[str]`

Splits normalized text into tokens, filtering out tokens shorter than `MIN_TOKEN_LEN`.

#### `shingles_from_tokens(tokens: List[str], k: int) -> Set[str]`

Creates k-shingles (contiguous n-grams) from token list:

- Generates k-length token sequences
- Hashes each shingle using SHA-1 for memory efficiency
- Returns set of hashed shingles

#### `jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float`

Calculates Jaccard similarity coefficient:

```
J(A,B) = |A ∩ B| / |A ∪ B|
```

Returns value between 0.0 (no similarity) and 1.0 (identical).

### Data Structures

#### `DocRepresentation`

Dataclass storing processed document information:

- `doc_id`: Unique identifier (hash of path + metadata)
- `path`: Original file path
- `shingles`: Set of hashed shingles
- `token_count`: Total number of tokens
- `raw_text_excerpt`: First 400 characters for preview

### PDF Processing

#### `extract_text_and_ocr_from_pdf(path: str) -> str`

Performs single-pass extraction:

1. Extracts regular text from each page using PyMuPDF
2. Extracts embedded images
3. Converts images to base64 and runs OCR
4. Concatenates all text sources

Includes error handling for OCR failures to prevent pipeline interruption.

### Persistence Functions

#### `load_cached_representations() -> Dict[str, DocRepresentation]`

Loads previously processed document representations from pickle file.

#### `save_cached_representations(reps: Dict[str, DocRepresentation])`

Persists document representations to disk.

## Main Class: PlagiarismChecker

### Initialization

```python
checker = PlagiarismChecker(shingle_size=5)
```

Loads cached representations and builds an inverted index mapping shingles to document IDs.

### Key Methods

#### `process_and_check(path: str) -> Dict[str, float]`

Main processing method:

1. Generates unique document ID from path and file metadata
2. Checks cache for existing representation
3. If new, performs full extraction and shingling
4. Compares against all existing documents
5. Updates cache and returns similarity scores

Returns: Dictionary mapping document IDs to similarity scores

#### `compare_against_all(doc_id: str) -> Dict[str, float]`

Compares a cached document against all other cached documents.

#### `recompute_all_pairwise() -> Dict[Tuple[str, str], float]`

Recomputes all pairwise similarities for cached documents.

#### `find_top_matches(doc_id: str, top_k: int = 5) -> List[Tuple[str, float]]`

Returns top K most similar documents to the specified document.

### Private Methods

#### `_make_doc_id(path: str) -> str`

Generates deterministic document ID using SHA-1 hash of:

- File path
- File size
- Last modification time

## Command Line Interface

### Usage

```bash
python plagiarism_checker.py file1.pdf file2.pdf file3.pdf [options]
```

### Arguments

- `pdfs`: One or more PDF files to process (required)
- `--shingle`: Shingle size (default: 5)
- `--topk`: Number of top matches to display per document (default: 5)

### Example

```bash
python plagiarism_checker.py paper1.pdf paper2.pdf paper3.pdf --shingle 7 --topk 3
```

### Output Format

For each processed document:

```
Results for paper1.pdf (doc_id=abc123...):
  match -> paper2.pdf (id=def456...) score=0.7542
  match -> paper3.pdf (id=ghi789...) score=0.3215
```

## Algorithm Details

### Shingling Process

1. **Text Extraction**: Extract all text including OCR from images
2. **Normalization**: Lowercase, remove punctuation, collapse whitespace
3. **Tokenization**: Split into words ≥ MIN_TOKEN_LEN characters
4. **Shingle Generation**: Create overlapping k-grams of tokens
5. **Hashing**: Convert shingles to SHA-1 hashes for efficiency

### Similarity Detection

- Uses Jaccard similarity on shingle sets
- Higher scores indicate more textual overlap
- Typical thresholds:
  - < 0.3: Low similarity
  - 0.3-0.6: Moderate similarity
  - > 0.6: High similarity (potential plagiarism)

## Performance Considerations

### Memory Optimization

- Shingles are hashed to reduce memory footprint
- Only stores essential metadata per document

### Caching Benefits

- Avoids reprocessing unchanged documents
- Fast lookups using inverted shingle index
- Persistent across runs

### Scalability

- Single-pass processing minimizes I/O
- Inverted index enables efficient candidate retrieval
- Pairwise comparison is O(n²) but optimized with set operations

## Tuning Parameters

### `SHINGLE_SIZE`

- **Smaller values (3-4)**: More sensitive, catches smaller matches
- **Larger values (7-10)**: More specific, reduces false positives
- **Recommended**: 5-7 for most documents

### `MIN_TOKEN_LEN`

- Filters noise from very short tokens
- Default of 2 balances coverage and precision

## Limitations

1. **Language-specific**: Designed for languages with space-separated words
2. **OCR quality**: Depends on image quality and OCR accuracy
3. **Paraphrasing**: Won't detect heavily reworded content
4. **Structure**: Doesn't consider document structure or semantics

## Error Handling

- OCR failures are logged as warnings but don't halt processing
- Missing cache files are handled gracefully
- File access errors should be caught by calling code

## Future Enhancements

Potential improvements:

- MinHash for faster approximate similarity
- Semantic similarity using embeddings
- Visualization of matching text segments
- Support for other document formats
- Parallel processing for large document sets
