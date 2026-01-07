from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import uuid4,List
from bson import ObjectId
from Database.Helper import PyObjectId


class DocumentModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    document_name: str
    document_path: str
    result: dict


class ProjectModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    status: str = "active"
    path: str
    documents: List[str] = []  # stores only document IDs


class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str
    email: EmailStr
    storage: int = 0
    projects: List[str] = []  # stores only project IDs

    class Config:
        json_encoders = {ObjectId: str}
