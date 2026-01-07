
# --- WebSocket Route ---
import json
from fastapi import WebSocket, WebSocketDisconnect

from Utils.Scheduler import process_documents


async def analyze_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        payload = json.loads(data)

        project_id = payload.get("project_id")
        ai_model = payload.get("ai_model")
        plag_model = payload.get("plagiarism_model")

        if not all([project_id, ai_model, plag_model]):
            await websocket.send_json({"error": "Missing one or more required parameters"})
            await websocket.close()
            return

        # Schedule the analysis in background
        await process_documents(websocket, project_id, ai_model, plag_model)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close()