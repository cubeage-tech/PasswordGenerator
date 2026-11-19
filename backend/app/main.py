from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.database.connection import Base, engine
from app.database import models
from app.modules.auth.router import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyPass API",
    description="Smart Password Generator and Account Security",
    version="1.0.0",
)


@app.exception_handler(RequestValidationError)
async def safe_validation_error(request: Request, exc: RequestValidationError):
    """Keep submitted secrets out of validation error responses."""
    sanitized_errors = [
        {key: value for key, value in error.items() if key not in {"input", "ctx"}}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": sanitized_errors})

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)


@app.get("/")
def home():
    return {"message": "Welcome to MyPass API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
