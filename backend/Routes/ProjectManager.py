
import os
import tempfile
from typing import Dict
import zipfile
from fastapi import UploadFile, HTTPException
from fastapi.responses import JSONResponse

from Routes.CONFIG import MAX_FILE_SIZE_BYTES
from Utils.File import UPLOAD_DIR, calculate_directory_size, calculate_directory_size_for_user, copy_temp_tree_to_storage
from motor.motor_asyncio import AsyncIOMotorCollection
from Database.Document import RegisterDocument
from Database.Project import RegisterProject
from bson.int64 import Int64
from Database.User import get_all_user_projects


# New Project
async def NewProject(
    zip_file: UploadFile,
    project_name: str,
    current_user: Dict,
    user_collection: AsyncIOMotorCollection,
    document_collection: AsyncIOMotorCollection,
    project_collection: AsyncIOMotorCollection
):
    """
    Accepts a ZIP file and project name, extracts the file, and calculates 
    the total disk space used by the extracted contents.
    """
    if not zip_file.filename or not zip_file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=400, detail="File must be a ZIP archive.")

    # Create a temporary directory to store the ZIP file and extracted contents
    with tempfile.TemporaryDirectory() as temp_dir:
        zip_path = os.path.join(temp_dir, zip_file.filename)
        extract_path = os.path.join(temp_dir, project_name)
        os.makedirs(extract_path, exist_ok=True)  # Directory for extraction

        try:
            content = await zip_file.read()
            if len(content) > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413, detail=f"File too large. Max size is {MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f} MB.")

            with open(zip_path, "wb") as f:
                f.write(content)

            files = []
            # 2. Extract the ZIP file
            with zipfile.ZipFile(zip_path, 'r') as zf:
                # Prevent Zip Slip vulnerability by checking paths (best practice)

                for member in zf.namelist():
                    if '..' in member or member.startswith('/') or member.startswith('\\'):
                        continue
                    zf.extract(member, extract_path)
                    file_id = await RegisterDocument(
                        document_name=os.path.basename(member),
                        document_path=os.path.join(
                            UPLOAD_DIR, current_user["id"], project_name, "uploads", member),
                        document_collection=document_collection
                    )
                    files.append(file_id)
            copy_temp_tree_to_storage(
                extract_path, current_user["id"], project_name)

            disk_space_bytes = calculate_directory_size(extract_path)
            disk_space_mb = disk_space_bytes / (1024 * 1024)

            # Update user's storage information in the database
            project_uid = await RegisterProject(
                project_name=project_name,
                project_path=os.path.join(
                    UPLOAD_DIR, current_user["id"], project_name),
                documents=files,
                project_collection=project_collection
            )

            await user_collection.update_one(
                {"_id": current_user["id"]},
                {
                    # ensures storage is stored as int64
                    "$set": {"storage": Int64(disk_space_bytes)},
                    # appends new project to list
                    "$push": {"projects": project_uid}
                }
            )

            return JSONResponse({
                "message": "Project uploaded, extracted, and analyzed successfully",
                "project_name": project_name,
                "extracted_path": extract_path,  # For reference
                "extracted_size_bytes": disk_space_bytes,
                "extracted_size_mb": f"{disk_space_mb:.2f} MB",
            })

        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=400, detail="The uploaded file is not a valid ZIP file.")
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Internal server error during processing: {str(e)}")

async def GetUserProjects(
    current_user: Dict,
    project_collection: AsyncIOMotorCollection,
    user_collection: AsyncIOMotorCollection
):
    """
    Retrieves all projects associated with the current user.
    """


    try:
        project_ids = await user_collection.find_one(
            {"_id": current_user["id"]},
            {"projects": 1}
        )
        projects = await get_all_user_projects(
            project_ids["projects"], project_collection)

        return JSONResponse({
            "message": "User projects retrieved successfully",
            "projects": projects
        })

    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")