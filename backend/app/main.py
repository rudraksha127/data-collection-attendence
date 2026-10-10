"""FastAPI application entrypoint — modular monolith for the Student Data Collection PWA backend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import admin, auth, health, students, submissions
from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import ERROR_CODES, ApiError
from app.core.logging import configure_logging

configure_logging(debug=settings.debug)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Dev convenience: auto-create tables on SQLite. On PostgreSQL use Alembic.
    if settings.database_url.startswith("sqlite"):
        from app.core.database import Base
        import app.models  # noqa: F401  (register all tables)

        Base.metadata.create_all(engine)
    yield


app = FastAPI(
    title="Student Data Collection API",
    version="1.0.0",
    description="Backend foundation: collect → validate → store → admin review.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _envelope(status_code: int, code: str, message: str, details: dict | None = None) -> JSONResponse:
    body: dict = {"success": False, "error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body)


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return _envelope(exc.status_code, exc.code, exc.message, exc.details)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return _envelope(422, "VALIDATION_ERROR", "Request validation failed.", {"fields": jsonable_encoder(exc.errors())})


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = ERROR_CODES.get(exc.status_code, "ERROR")
    # Never expose framework internals; map to the stable envelope.
    message = exc.detail if isinstance(exc.detail, str) else "Request failed."
    return _envelope(exc.status_code, code, message)


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never leak internals (stack traces, SQL, filesystem paths) to clients.
    return _envelope(500, "INTERNAL_ERROR", "An unexpected error occurred.")


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(submissions.router)
app.include_router(admin.router)
