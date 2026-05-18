from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.qa import router as qa_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.search import router as search_router

app = FastAPI(title='StudyLens AI')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(qa_router)
app.include_router(search_router)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

@app.get('/')
def root():
    return {'message': 'StudyLens AI Backend Running'}
