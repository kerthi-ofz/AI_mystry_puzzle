from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.cases import router as cases_router
from routers.jobs import router as jobs_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases_router, prefix="/cases")
app.include_router(jobs_router, prefix="/jobs")

@app.get("/")
def root():
    return {"message": "Mystery Puzzle Backend Running with Ollama"}
