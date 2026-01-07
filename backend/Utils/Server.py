from flask import Flask, jsonify, render_template, request
import logging
from Tesseract.OCR import ocr_from_base64

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, template_folder="Templates")

@app.route('/Run', methods=['GET'])
def run():
    logging.info("Run endpoint called")
    return jsonify({"message": "Run endpoint called"}), 200

@app.route('/api/ocr', methods=['POST'])
def ocr_endpoint():
    data = request.get_json()
    base64_image = data.get("image")

    if not base64_image:
        return jsonify({"error": "No image provided"}), 400

    logging.info("OCR endpoint called")
    extracted_text = ocr_from_base64(base64_image)
    return jsonify({"extracted_text": extracted_text}), 200

@app.route("/OCR", methods=['GET'])
def ocr_test():
    return render_template("OCR-Test.html")

app.run(host='0.0.0.0', port=5000, debug=True)