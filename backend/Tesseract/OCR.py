import base64
from io import BytesIO
from PIL import Image
import pytesseract

def ocr_from_base64(base64_string):
    try:
        # Decode base64 to image bytes
        image_data = base64.b64decode(base64_string)

        # Open image from bytes
        image = Image.open(BytesIO(image_data))

        # Perform OCR
        text = pytesseract.image_to_string(image)

        return text.strip()
    except Exception as e:
        return f"❌ Error during OCR: {e}"

# --- Example usage ---
if __name__ == "__main__":
    # Example base64 image (replace this with your own)
    base64_image = """
    iVBORw0KGgoAAAANSUhEUgAAAGQAAAAUCAYAAAD4x8FvAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8
    YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADRSURBVFhH7ZbBDoAwDEW3T4n7H3ZFBvTg4GQhmlkVfK8M
    Dq0+X4BaRpWaOhKpkl1L63iHz8aNHGLAwYMGDBgwIABAwYMGDBgwIABAwYMGPj+D5GVw3td+YqG5m1Hg
    G5lRpGKplG8r7Qtt1aN6uWUGCDBgwYMCAAQMGDBgwYMAAAf8BhwA+zCg2C6cz9AAAAAElFTkSuQmCC
    """
    text = ocr_from_base64(base64_image)
    print("✅ Extracted Text:\n", text)
