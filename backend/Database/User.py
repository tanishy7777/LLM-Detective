from ast import List
from pymongo.collection import Collection
from uuid import uuid4
from bson.int64 import Int64
from bson.objectid import ObjectId

from Utils.File import generate_directory_structure_new_user

async def get_or_create_user(email: str, name: str, users_collection: Collection) -> dict:
    """Fetch a user by email. If not found, create a new one."""
    user = await users_collection.find_one({"email": email})

    if user:
        return user

    # Create new user
    new_user = {
        "_id": str(uuid4()),
        "name": name,  # default username from email
        "email": email,
        "storage": Int64(0),  # explicitly stored as int64
        "projects": []
    }
    
    generate_directory_structure_new_user(new_user["_id"])

    await users_collection.insert_one(new_user)
    return new_user

async def get_all_user_projects(project_ids: List, project_collection: Collection) -> list:
    """
    Retrieve all projects associated with a user and convert the MongoDB ObjectId 
    to a string to prevent JSON serialization errors.
    """
    projects = []
    
    # 1. Convert all project ID strings to BSON ObjectId objects
    object_ids = []
    for project_id in project_ids:
        try:
            object_ids.append(ObjectId(project_id))
        except:
            # Handle case where the string isn't a valid ObjectId
            raise ValueError(f"Invalid Project ID format: {project_id}")

    # 2. Query all documents in a single go for efficiency
    cursor = project_collection.find({"_id": {"$in": object_ids}})
    
    # 3. Process the results
    async for p in cursor:
        if p and '_id' in p:
            p['_id'] = str(p['_id'])
        projects.append(p)
    
    if len(projects) != len(object_ids):
        if not projects and object_ids:
            raise ValueError(f"No projects found for the provided IDs.")

        pass 

    # We will still use the original loop-based logic for direct error reporting:
    if len(projects) != len(object_ids):
        found_ids = {p['id'] if 'id' in p else str(p['_id']) for p in projects}
        missing_ids = [str(oid) for oid in object_ids if str(oid) not in found_ids]
        if missing_ids:
             raise ValueError(f"Project(s) with ID(s) {', '.join(missing_ids)} not found")

    return projects