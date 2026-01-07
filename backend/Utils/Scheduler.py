
# --- Mock document retrieval (replace with your DB or filesystem logic) ---
import asyncio
import random
from typing import List, Dict, Any

from fastapi import WebSocket
from fastapi.concurrency import run_in_threadpool


def get_documents_for_project(project_id: str) -> List:
    return [
        {"id": f"doc_{i}", "content": f"Content of document {i} for {project_id}"}
        for i in range(1, 6)
    ]


# --- Mock model inference functions ---
def run_ai_model(ai_model: str, content: str) -> Dict:
    # simulate model processing
    asyncio.sleep(0.2)
    return {0: round(random.uniform(0, 1), 2), 
            1: round(random.uniform(0, 1), 2), 
            2: round(random.uniform(0, 1), 2), 
            3: round(random.uniform(0, 1), 2)}


def run_plagiarism_model(plag_model: str, content: str) -> Dict:
    # simulate model processing
    asyncio.sleep(0.2)
    return {"p_score": round(random.uniform(0, 1), 2)}


# --- Core background task ---
async def process_documents(websocket: WebSocket, project_id: str, ai_model: str, plag_model: str):
    documents = get_documents_for_project(project_id)
    total = len(documents)

    await websocket.send_json({"status": "started", "total_docs": total})

    for idx, doc in enumerate(documents, start=1):
        try:
            # Run both models concurrently
            ai_result = await run_in_threadpool(run_ai_model, ai_model, doc["content"])
            plag_result = await run_in_threadpool(run_plagiarism_model, plag_model, doc["content"])

            result = {
                "doc_id": doc["id"],
                "ai_result": ai_result,
                "plag_result": plag_result,
                "progress": f"{idx}/{total}",
            }

            await websocket.send_json(result)

            # Simulate time gap between docs
            await asyncio.sleep(0.5)

        except Exception as e:
            await websocket.send_json({"error": str(e), "doc_id": doc["id"]})

    await websocket.send_json({"status": "completed"})
