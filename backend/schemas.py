from pydantic import BaseModel
from typing import Optional, Dict, List
from enum import Enum

class JobStatus(str, Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"

class MysteryCaseCreate(BaseModel):
    theme: str
    mystery_type: str
    setting: Optional[str] = None

class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    case_id: Optional[str] = None
    error: Optional[str] = None

class MysteryCaseResponse(BaseModel):
    id: str
    data: Dict

class ChoiceSelection(BaseModel):
    case_id: str
    scene_id: str
    option_index: int

class ChoiceResult(BaseModel):
    explanation: str
    correct: bool
    next_scene_id: str
    detective_score: Optional[int] = 0
    skill_demonstrated: Optional[str] = None
    evidence_gained: Optional[List[Dict]] = []
    success_message: Optional[str] = None
