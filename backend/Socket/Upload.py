import os
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from Utils import extract_zip  # adjust path if needed
from logging import logger  # optional if you have a custom logger

UPLOAD_DIR = "uploads"

async def websocket_upload(websocket: WebSocket):
    """Handle ZIP uploads via WebSocket and report progress to the client."""
    await websocket.accept()

    try:
        # --- Step 1: Receive metadata ---
        init_data = await websocket.receive_json()
        folder_name = init_data.get("folderName", "default_project")
        folder_path = os.path.join(UPLOAD_DIR, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        file_path = os.path.join(folder_path, "uploaded.zip")
        total_bytes = init_data.get("fileSize", 0)
        received_bytes = 0

        # --- Step 2: Receive file chunks ---
        with open(file_path, "wb") as f:
            while True:
                chunk = await websocket.receive_bytes()
                if chunk == b"__END__":
                    break
                f.write(chunk)
                received_bytes += len(chunk)
                # Optionally send upload progress (0–50%)
                progress = (received_bytes / total_bytes) * 50 if total_bytes else 0
                await websocket.send_json({"progress": progress, "status": "uploading"})

        # --- Step 3: Extract ZIP and send progress ---
        def progress_callback(pct, status):
            asyncio.create_task(websocket.send_json({
                "progress": 50 + pct / 2,  # extraction = 50–100%
                "status": status
            }))

        extract_zip(file_path, folder_path, progress_callback=progress_callback)

        await websocket.send_json({"progress": 100, "status": "done"})

    except WebSocketDisconnect:
        logger.warning("Client disconnected during upload")

    except Exception as e:
        logger.exception("Error during WebSocket upload")
        await websocket.send_json({"error": str(e), "status": "failed"})
