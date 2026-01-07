from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorCollection as Collection

async def RegisterProject(
    project_name: str,
    project_path: str,
    project_collection: Collection,
    documents: list = []
) -> str:
    """Register a new project in the database and return its ID."""
    new_project = {
        "id": str(uuid4()),
        "name": project_name,
        "path": project_path,
        "documents": documents,
        "status": "Upload"
    }
    result = await project_collection.insert_one(new_project)
    return str(result.inserted_id)