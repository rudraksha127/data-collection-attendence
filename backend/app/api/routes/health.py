"""Health endpoints — liveness and DB readiness."""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import ok

router = APIRouter(tags=["health"])


@router.get("/api/v1/health")
def health() -> object:
    return ok({"status": "ok", "service": "data-collection-backend"})


@router.get("/api/v1/health/readiness")
def readiness(db: Session = Depends(get_db)) -> object:
    try:
        db.execute(text("SELECT 1"))
        database = "up"
    except Exception:
        return ok({"status": "degraded", "database": "down"}, status_code=503)
    return ok({"status": "ready", "database": database})
