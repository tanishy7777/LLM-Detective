import base64
import io
import json
import os
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfMerger, PdfReader
from PIL import Image
import logging
import fitz
import httpx

from pdf2image import convert_from_bytes
from Tesseract.OCR import ocr_from_base64

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.trace import StatusCode  # Import StatusCode

from Utils.Para import split_paragraph
from Utils.File import UPLOAD_DIR, extract_zip
from reportlab.lib.colors import Color
import re

from Utils.PDF import HighlightParagraphs, HighlightSentences, highlight_paragraphs
from typing import Dict

# Databases
from motor.motor_asyncio import AsyncIOMotorClient
from Database.Credentials import MONGO_URL, MONGODB_DB_NAME
from Auth.Route import EmailInput, login_route
from Auth.JWT import get_current_user
from Routes.ProjectManager import GetUserProjects, NewProject
from Routes.Sheduler import analyze_websocket


client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGODB_DB_NAME]

users_collection = db["users"]
projects_collection = db["projects"]
documents_collection = db["documents"]

API_URL = "http://localhost:3344/api/get"

CATEGORY_COLORS = {
    0: (1, 0.6, 0.6),   # Light red
    1: (0.6, 1, 0.6),   # Light green
    2: (0.6, 0.6, 1),   # Light blue
    3: (1, 1, 0.6),     # Light yellow
    4: (1, 0.8, 0.6),   # Light orange
    5: (0.8, 0.6, 1)    # Light purple
}


def get_color_from_result(result):
    colors = {
        5: Color(1, 1, 1, alpha=0),     # transparent
        1: Color(1, 1, 0.7, alpha=0.4),
        2: Color(1, 0.9, 0.5, alpha=0.4),
        3: Color(1, 0.7, 0.3, alpha=0.4),
        4: Color(1, 0.4, 0.2, alpha=0.4),
        0: Color(1, 0, 0, alpha=0.4),
    }
    return colors.get(result, Color(1, 1, 1, alpha=0))


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tracing
# Give your service a name (this will appear in Jaeger)
resource = Resource(attributes={
    "service.name": "LLM-Detective"
})

provider = TracerProvider(resource=resource)
trace.set_tracer_provider(provider)

# Exporter (sends traces to an OpenTelemetry collector or compatible backend)
otlp_exporter = OTLPSpanExporter(
    endpoint="http://localhost:4317",  # default OTLP collector endpoint
    insecure=True
)


# Add the exporter to the tracer
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))

# Initialize FastAPI app
app = FastAPI(title="OCR FastAPI with OpenTelemetry")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument FastAPI and logging
FastAPIInstrumentor.instrument_app(app)
LoggingInstrumentor().instrument(set_logging_format=True)

# Mount static and templates
app.mount("/static", StaticFiles(directory="Static"), name="static")
templates = Jinja2Templates(directory="Templates")

# Get a tracer instance
tracer = trace.get_tracer(__name__)


@app.get("/Run")
async def run():
    logger.info("Run endpoint called")
    return JSONResponse({"message": "Run endpoint called"})


@app.post("/highlight_pdf")
async def highlight_pdf(file: UploadFile = File(...)):
    with tracer.start_as_current_span("highlight_pdf_endpoint") as span:
        # Add high-level metadata
        span.set_attribute("http.request_type", "POST")
        span.set_attribute("endpoint.path", "/highlight_pdf")
        span.set_attribute("file.name", file.filename)
        span.set_attribute("file.content_type", file.content_type)

        try:
            with tracer.start_as_current_span("read_file"):
                pdf_bytes = await file.read()
                span.add_event("File read successfully")

            with tracer.start_as_current_span("highlight_paragraphs_utility"):
                # Assuming highlight_paragraphs internally performs all the OCR, classification, and highlighting logic
                highlighted_pdf = highlight_paragraphs(pdf_bytes)
                span.add_event("PDF highlighting complete")

            with tracer.start_as_current_span("base64_encode"):
                # Encode result to Base64
                b64_pdf = base64.b64encode(highlighted_pdf).decode("utf-8")
                span.add_event("Base64 encoding complete")

            return JSONResponse(content={
                "status": "success",
                "filename": file.filename,
                "highlighted_pdf_base64": b64_pdf
            })

        except Exception as e:
            # Set span status to ERROR and record exception details
            span.set_status(StatusCode.ERROR,
                            description="PDF Highlighting Failed")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))
            return JSONResponse(content={
                "status": "error",
                "error": str(e)
            }, status_code=500)


@app.post("/api/ocr")
async def ocr_endpoint(request: Request):
    with tracer.start_as_current_span("ocr_process") as span:
        span.set_attribute("http.request_type", "POST")
        span.set_attribute("endpoint.path", "/api/ocr")

        data = await request.json()
        base64_image = data.get("image")

        if not base64_image:
            span.set_status(StatusCode.ERROR,
                            description="Missing Base64 image")
            return JSONResponse({"error": "No image provided"}, status_code=400)

        span.set_attribute("image.size_kb", len(base64_image) // 1024)
        logger.info("OCR endpoint called")

        try:
            with tracer.start_as_current_span("ocr_from_base64_call"):
                extracted_text = ocr_from_base64(base64_image)
                span.add_event("OCR text extracted")

            return JSONResponse({"extracted_text": extracted_text})

        except Exception as e:
            span.set_status(StatusCode.ERROR,
                            description="OCR Extraction Failed")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))
            return JSONResponse({"error": "Internal server error during OCR"}, status_code=500)


@app.get("/OCR", response_class=HTMLResponse)
async def ocr_test(request: Request):
    return templates.TemplateResponse("OCR-Test.html", {"request": request})


@app.post("/api/pdf/actual")
async def pdf_actual(file: UploadFile = File(...)):
    with tracer.start_as_current_span("pdf_actual_endpoint") as span:
        span.set_attribute("http.request_type", "POST")
        span.set_attribute("endpoint.path", "/api/pdf/actual")
        span.set_attribute("file.name", file.filename)

        if not file.filename.endswith(".pdf"):
            span.set_status(StatusCode.ERROR, description="Invalid file type")
            return JSONResponse({"error": "File must be a PDF"}, status_code=400)

        logger.info(f"Received PDF: {file.filename}")

        try:
            with tracer.start_as_current_span("read_pdf_bytes"):
                pdf_bytes = await file.read()
                span.add_event("PDF bytes read")

            with tracer.start_as_current_span("process_pdf_actual"):
                highlighted_pdf, data = await HighlightParagraphs(pdf_bytes)
                encoded_pdf = base64.b64encode(highlighted_pdf).decode("utf-8")
                processed_data = {
                    "message": "PDF processed successfully", "pdf_bytes": encoded_pdf, "data": data}
                span.add_event("PDF processing complete")

            return JSONResponse(processed_data)

        except Exception as e:
            span.set_status(StatusCode.ERROR,
                            description="PDF Actual Processing Failed")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))
            return JSONResponse({"error": "Internal server error during PDF processing", "msg": str(e)}, status_code=500)


@app.post("/api/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    with tracer.start_as_current_span("ocr_pdf_endpoint") as span:
        span.set_attribute("http.request_type", "POST")
        span.set_attribute("endpoint.path", "/api/ocr/pdf")
        span.set_attribute("file.name", file.filename)

        if not file.filename.endswith(".pdf"):
            span.set_status(StatusCode.ERROR, description="Invalid file type")
            return JSONResponse({"error": "File must be a PDF"}, status_code=400)

        logger.info(f"Received PDF: {file.filename}")

        try:
            with tracer.start_as_current_span("read_pdf_bytes"):
                pdf_bytes = await file.read()
                span.add_event("PDF bytes read")

            with tracer.start_as_current_span("convert_pdf_to_images") as convert_span:
                pages = convert_from_bytes(pdf_bytes)
                span.set_attribute("page.count", len(pages))
                convert_span.add_event(f"Converted to {len(pages)} images")

            extracted_text_pages = []

            for i, page in enumerate(pages):
                with tracer.start_as_current_span(f"process_page_{i + 1}") as page_span:
                    page_span.set_attribute("page.number", i + 1)

                    # Convert PIL Image to base64
                    with tracer.start_as_current_span("convert_image_to_base64"):
                        buffered = io.BytesIO()
                        page.save(buffered, format="PNG")
                        img_base64 = base64.b64encode(
                            buffered.getvalue()).decode()
                        page_span.add_event("Image base64 encoded")

                    # OCR
                    with tracer.start_as_current_span("ocr_extraction"):
                        text = ocr_from_base64(img_base64)
                        page_span.add_event("OCR complete")

                    with tracer.start_as_current_span("split_text_to_chunks"):
                        tokens = split_paragraph(text, max_words=50)
                        page_span.set_attribute("chunk.count", len(tokens))

                    url = "http://localhost:3344/api/get"
                    final = []
                    for j, token in enumerate(tokens):
                        with tracer.start_as_current_span(f"classify_chunk_{j + 1}") as chunk_span:
                            chunk_span.set_attribute("chunk.index", j + 1)
                            payload = {"chars": token}
                            try:
                                async with httpx.AsyncClient() as client:
                                    response = await client.post(url, json=payload)
                                    chunk_span.set_attribute(
                                        "http.status_code", response.status_code)

                                    if response.status_code == 200:
                                        data = response.json()
                                        final.append(data)
                                        chunk_span.add_event(
                                            "Classification successful")
                                    else:
                                        chunk_span.set_status(
                                            StatusCode.ERROR, description=f"Classification API Error: {response.status_code}")
                                        logger.error(
                                            f"Error fetching random number: {response.text}")
                            except Exception as http_e:
                                chunk_span.set_status(
                                    StatusCode.ERROR, description="Classification API Connection Failed")
                                chunk_span.record_exception(http_e)

                    extracted_text_pages.append(
                        {"page": i + 1, "text": text, "final": final})

            span.add_event("All pages processed")
            return JSONResponse({"pages": extracted_text_pages})

        except Exception as e:
            span.set_status(StatusCode.ERROR,
                            description="OCR PDF Processing Failed")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))
            return JSONResponse({"error": "Internal server error during PDF OCR"}, status_code=500)


@app.websocket("/ws/ocr/pdf")
async def ocr_pdf_ws(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected. Send PDF bytes now.")

    with tracer.start_as_current_span("ws_ocr_pdf_endpoint") as span:
        span.set_attribute("websocket.type", "ocr_pdf")

        try:
            # Receive binary PDF file from client
            pdf_bytes = await websocket.receive_bytes()
            logger.info("Received PDF via WebSocket")
            span.add_event("Received PDF bytes")

            # Convert to images
            with tracer.start_as_current_span("ws_convert_pdf_to_images") as convert_span:
                pages = convert_from_bytes(pdf_bytes)
                span.set_attribute("page.count", len(pages))
                convert_span.add_event(f"Converted to {len(pages)} images")

            await websocket.send_text(json.dumps({
                "total pages": len(pages)
            }))

            for i, page in enumerate(pages):
                with tracer.start_as_current_span(f"ws_process_page_{i + 1}") as page_span:
                    page_span.set_attribute("page.number", i + 1)

                    # Convert PIL Image to base64
                    with tracer.start_as_current_span("ws_convert_image_to_base64"):
                        buffered = io.BytesIO()
                        page.save(buffered, format="PNG")
                        img_base64 = base64.b64encode(
                            buffered.getvalue()).decode()
                        page_span.add_event("Image base64 encoded")

                    # OCR text extraction
                    with tracer.start_as_current_span("ws_ocr_extraction"):
                        text = ocr_from_base64(img_base64)
                        page_span.add_event("OCR complete")

                    with tracer.start_as_current_span("ws_split_text_to_chunks"):
                        tokens = split_paragraph(text, max_words=50)
                        page_span.set_attribute("chunk.count", len(tokens))

                    url = "http://localhost:3344/api/get"
                    page_result = []

                    for j, token in enumerate(tokens):
                        with tracer.start_as_current_span(f"ws_classify_chunk_{j + 1}") as chunk_span:
                            chunk_span.set_attribute("chunk.index", j + 1)
                            payload = {"chars": token}

                            try:
                                async with httpx.AsyncClient() as client:
                                    response = await client.post(url, json=payload)
                                    chunk_span.set_attribute(
                                        "http.status_code", response.status_code)

                                if response.status_code == 200:
                                    data = response.json()
                                    page_result.append(data)

                                    # Send each result to client immediately
                                    await websocket.send_text(json.dumps({
                                        "page": i + 1,
                                        "chunk": j + 1,
                                        "text": token,  # <--- MODIFIED: Added the actual text chunk
                                        "data": data
                                    }))
                                    chunk_span.add_event(
                                        "Chunk classification sent to client")
                                    logger.info(
                                        f"Page {i+1}, Chunk {j+1}: {data}")
                                else:
                                    await websocket.send_text(json.dumps({
                                        "page": i + 1,
                                        "chunk": j + 1,
                                        "error": response.text
                                    }))
                                    chunk_span.set_status(
                                        StatusCode.ERROR, description="Classification API Failed")
                                    logger.error(
                                        f"Error fetching random number: {response.text}")
                            except WebSocketDisconnect:
                                logger.info(
                                    "Client disconnected during chunk transmission")
                                raise  # Re-raise to be caught outside the loop
                            except Exception as http_e:
                                chunk_span.set_status(
                                    StatusCode.ERROR, description="Classification API Connection Failed")
                                chunk_span.record_exception(http_e)
                                # Continue processing other chunks but log the error

                    # Send page completion message
                    try:
                        await websocket.send_text(json.dumps({
                            "page": i + 1,
                            "status": "completed"
                        }))
                        page_span.add_event("Page completed message sent")
                    except WebSocketDisconnect:
                        logger.info(
                            "Client disconnected during page completion")
                        raise

            await websocket.send_text(json.dumps({"status": "done"}))
            await websocket.close()
            span.add_event("WebSocket connection closed successfully")

        except WebSocketDisconnect:
            logger.warning("Client disconnected")
            # Not an error, just connection termination
            span.set_status(StatusCode.OK, description="Client Disconnected")
        except Exception as e:
            logger.exception("Error during WebSocket OCR processing")
            span.set_status(StatusCode.ERROR,
                            description="WebSocket Processing Error")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))
            try:
                await websocket.send_text(json.dumps({"error": str(e)}))
                await websocket.close()
            except:
                logger.error(
                    "Failed to send error message to disconnected client")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("Fin-PDF-High.html", {"request": request})


@app.websocket("/ws/upload")
async def websocket_upload(websocket: WebSocket):
    await websocket.accept()
    with tracer.start_as_current_span("ws_upload_zip") as span:
        span.set_attribute("websocket.type", "upload_zip")
        try:
            init_data = await websocket.receive_json()
            span.add_event("Received initial metadata")

            folder_name = init_data.get("folderName", "default_project")
            folder_path = os.path.join(UPLOAD_DIR, folder_name)
            os.makedirs(folder_path, exist_ok=True)
            span.set_attribute("upload.folder_name", folder_name)

            file_path = os.path.join(folder_path, "uploaded.zip")
            total_bytes = init_data.get("fileSize", 0)
            received_bytes = 0
            span.set_attribute("file.size_bytes", total_bytes)

            # Receive file in chunks
            while True:
                with tracer.start_as_current_span("receive_chunk"):
                    chunk = await websocket.receive_bytes()
                    if chunk == b"__END__":
                        span.add_event("File transfer complete")
                        break
                    with open(file_path, "ab") as f:
                        f.write(chunk)
                    received_bytes += len(chunk)
                    percent = (received_bytes / total_bytes) * \
                        50  # upload = 0-50%
                    # Note: Sending progress messages is an IO operation, we'll keep it simple here.

            # Extraction using utility function
            def callback(pct, status):
                import asyncio
                # Use a new span for the extraction progress updates
                with tracer.start_as_current_span("zip_extraction_progress"):
                    asyncio.create_task(websocket.send_json(
                        {"progress": 50 + pct/2, "status": status}))

            with tracer.start_as_current_span("extract_zip_utility"):
                extract_zip(file_path, folder_path, progress_callback=callback)
                span.add_event("ZIP extraction complete")

            await websocket.send_json({"progress": 100, "status": "done"})

        except WebSocketDisconnect:
            logger.warning("Client disconnected during upload")
            span.set_status(StatusCode.OK, description="Client Disconnected")
        except Exception as e:
            logger.exception("Error during WebSocket file upload")
            span.set_status(StatusCode.ERROR,
                            description="File Upload/Extraction Failed")
            span.record_exception(e)
            span.set_attribute("error.message", str(e))

# Main Links


@app.post("/api/login")
async def login_user(payload: EmailInput):
    return await login_route(payload, users_collection, projects_collection)


@app.post("/api/project/new")
async def project_upload(
    zip_file: UploadFile = File(..., description="The project ZIP archive."),
    project_name: str = Form(
        "default_project", description="The name of the project."),
    current_user: Dict = Depends(get_current_user)
):
    # Start the top-level span for the entire request lifecycle
    with tracer.start_as_current_span("project_new_endpoint") as span:
        span.set_attribute("user.email", current_user.get("sub", "Error"))
        span.set_attribute("user.id", current_user.get("id", "Error"))
        span.set_attribute("project.name", project_name)
        span.set_attribute("file.name", zip_file.filename)

        # Delegate to the core logic function, passing the span
    return await NewProject(zip_file, project_name, current_user, 
                            users_collection, documents_collection, projects_collection)

@app.get("/api/project")
async def GetProject(current_user: Dict = Depends(get_current_user)):
    with tracer.start_as_current_span("GetProject") as span:
        span.set_attribute("user.email", current_user.get("sub", "Error"))
        span.set_attribute("user.id", current_user.get("id", "Error"))

    return await GetUserProjects(current_user, projects_collection, users_collection)

@app.websocket("/ws/analyze")
async def Analyser(websocket: WebSocket):
   return await analyze_websocket(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
