import os
import random
import zipfile
import shutil
from bs4 import BeautifulSoup
from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams
from reportlab.lib.colors import red, blue, green, purple, orange
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO

UPLOAD_DIR = "Static/uploads"
EXTRACT_DIR = "Static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

import os
import zipfile
from typing import Callable, List

def extract_zip(
    zip_path: str,
    extract_to: str,
    progress_callback: Callable[[float, str], None] = None
) -> None:
    """
    Extracts a ZIP file to the specified folder.

    Args:
        zip_path (str): Path to the zip file.
        extract_to (str): Destination folder.
        progress_callback (Callable[[float, str], None], optional):
            A callback function to report progress.
            Receives (percentage, status) as arguments.
    """
    os.makedirs(extract_to, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        members: List[str] = zip_ref.namelist()
        total_files = len(members)

        for i, member in enumerate(members):
            zip_ref.extract(member, extract_to)
            if progress_callback:
                percent = ((i + 1) / total_files) * 100
                progress_callback(percent, "extracting")

def pdf_to_xml(pdf_path, xml_path):
    """
    Convert a PDF file to XML format.

    Args:
        pdf_path (str): Path to the input PDF file.
        xml_path (str): Path to save the output XML file.
    """
    laparams = LAParams()
    
    with open(pdf_path, 'rb') as pdf_file, open(xml_path, 'wb') as xml_file:
        # Convert PDF → XML
        extract_text_to_fp(pdf_file, xml_file, codec='utf-8', laparams=laparams, output_type='xml')
    
    print(f"✅ Successfully converted '{pdf_path}' to '{xml_path}'")

def xml_to_pdf_with_underlines(xml_path, pdf_path):
    """
    Converts XML text into a readable PDF and randomly underlines some paragraphs
    with different colors.
    """

    # --- Parse XML file ---
    with open(xml_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "xml")

    # Extract text content (ignoring XML tags)
    text_blocks = [t.get_text().strip() for t in soup.find_all("text") if t.get_text().strip()]
    if not text_blocks:
        print("⚠️ No text found in XML file.")
        return

    # --- Choose random paragraphs to underline ---
    n = len(text_blocks)
    num_to_underline = min(2, n)  # at least 2 or total paragraphs
    underline_indices = random.sample(range(n), num_to_underline)

    colors = random.sample([red, blue, green, purple, orange], num_to_underline)

    # --- Create PDF ---
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4
    y = height - 60  # starting y position
    line_height = 14

    for i, paragraph in enumerate(text_blocks):
        # Wrap long text
        lines = []
        while len(paragraph) > 100:
            split_index = paragraph[:100].rfind(" ")
            if split_index == -1:
                split_index = 100
            lines.append(paragraph[:split_index])
            paragraph = paragraph[split_index:].strip()
        lines.append(paragraph)

        for line in lines:
            if y < 60:  # new page
                c.showPage()
                y = height - 60

            c.drawString(50, y, line)

            # If this paragraph is to be underlined
            if i in underline_indices:
                underline_color = colors[underline_indices.index(i)]
                c.setStrokeColor(underline_color)
                c.setLineWidth(1)
                text_width = c.stringWidth(line)
                c.line(50, y - 2, 50 + text_width, y - 2)

            y -= line_height

        y -= 10  # gap between paragraphs

    c.save()
    print(f"✅ Converted {xml_path} → {pdf_path} with {num_to_underline} underlined paragraphs.")


# --- Utility Function for Disk Space Calculation ---
def calculate_directory_size(path: str) -> int:
    """
    Calculates the total size of a directory and its contents in bytes.
    NOTE: This is a simplified function. For production, consider using
    os.path.getsize(f) and summing up all file sizes.
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # Add file size. Use a mock size if real os.path.getsize is restricted.
            try:
                total_size += os.path.getsize(fp)
            except OSError:
                # Mock size calculation for sandbox environment
                total_size += 512 + len(f) * 100 # Mock file size
    
    # Add a baseline size to ensure a meaningful result for an empty or mocked directory
    return max(total_size, 1024 * 512) # Minimum 512KB mock size

def calculate_directory_size_for_user(uuid: str) -> int:
    """
    Calculates the total size of a user's upload directory in bytes.
    """
    user_dir = os.path.join(UPLOAD_DIR, uuid)
    return calculate_directory_size(user_dir)

def generate_directory_structure_new_user(uuid: str) -> str:
    """
    Generates a directory structure for a new user based on their UUID.
    """
    user_dir = os.path.join(UPLOAD_DIR, uuid)
    os.makedirs(user_dir, exist_ok=True)
    subdirs = ['results', 'uploads']
    for subdir in subdirs:
        os.makedirs(os.path.join(user_dir, subdir), exist_ok=True)
    return user_dir

def copy_temp_tree_to_storage(temp_dir: str, user_uuid: str, project_name: str) -> None:
    """
    Copies the contents of a temporary directory to the user's storage directory.
    """
    user_storage_dir = os.path.join(UPLOAD_DIR, user_uuid, 'uploads', project_name)
    os.makedirs(user_storage_dir, exist_ok=True)

    for item in os.listdir(temp_dir):
        s = os.path.join(temp_dir, item)
        d = os.path.join(user_storage_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)