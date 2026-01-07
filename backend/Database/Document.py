from uuid import uuid4
from motor.motor_asyncio import AsyncIOMotorCollection as Collection


async def RegisterDocument(
    document_name: str,
    document_path: str,
    document_collection: Collection
) -> str:
    """Register a new document in the database and return its ID."""
    new_document = {
        "id": str(uuid4()),
        "document_name": document_name,
        "document_path": document_path,
        "result": {}
    }
    result = await document_collection.insert_one(new_document)
    return str(result.inserted_id)