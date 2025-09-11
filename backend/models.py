from sqlalchemy import Column, String, JSON, Enum, Integer, ARRAY
from db import Base
import enum

class JobStatus(str, enum.Enum):
    processing = "processing"
    completed = "completed"
    failed = "failed"

class MysteryCase(Base):
    __tablename__ = "mystery_cases"
    id = Column(String, primary_key=True, index=True)
    data = Column(JSON)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, index=True)
    status = Column(Enum(JobStatus), default=JobStatus.processing)
    case_id = Column(String, nullable=True, index=True)
    error = Column(String, nullable=True)

class GameSession(Base):
    __tablename__ = "game_sessions"
    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, nullable=False, index=True)
    detective_score = Column(Integer, default=0)
    evidence_collected = Column(JSON, default=list)
    witnesses_interviewed = Column(JSON, default=list)
    deduction_points = Column(Integer, default=0)
