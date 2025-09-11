from fastapi import APIRouter, HTTPException
from schemas import JobResponse, JobStatus
from models import Job
from db import SessionLocal

router = APIRouter()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    db.close()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(
        job_id=job.id,
        status=job.status,
        case_id=job.case_id,
        error=job.error,
    )
