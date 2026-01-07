from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorCollection
from Auth.JWT import create_access_token
from Database.User import get_or_create_user, get_all_user_projects


class EmailInput(BaseModel):
    email: EmailStr
    name: str


async def login_route(payload: EmailInput, users_collection: AsyncIOMotorCollection, projects_collection: AsyncIOMotorCollection):
    email = payload.email
    name = payload.name
    user = await get_or_create_user(email, name, users_collection)
    projects = await get_all_user_projects(user.get("projects", []), projects_collection)

    # Prepare user details (excluding sensitive fields)
    
    user_details = {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user["email"],
        "storage": user.get("storage", 0),
        "projects": user.get("projects", []),
    }

    # Create JWT Token
    access_token = create_access_token(
        data={"sub": user["email"], "id": str(user["_id"])})

    return JSONResponse(
        content={
            "token": access_token,
            "user": user_details,
            "projects": projects
        }
    )
