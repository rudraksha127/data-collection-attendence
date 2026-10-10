"""Audit service — append-only events for important operations. Never logs secrets."""
import json

from sqlalchemy.orm import Session

from app.models.audit import AuditEvent


def record(
    db: Session,
    event_type: str,
    *,
    actor_user_id: str | None = None,
    actor_role: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    detail: dict | None = None,
) -> None:
    db.add(
        AuditEvent(
            event_type=event_type,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=json.dumps(detail) if detail else None,
        )
    )
