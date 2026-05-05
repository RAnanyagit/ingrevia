from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AnalysisLogResponse(BaseModel):
    id: int
    ingredient_input: str
    overall_score: int
    category: str
    timestamp: datetime

    class Config:
        from_attributes = True

class IngredientListRequest(BaseModel):
    ingredients: str
    user_email: Optional[str] = None


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    age: int
    phone: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserAllergyCreate(BaseModel):
    user_email: str
    allergies: List[str]
