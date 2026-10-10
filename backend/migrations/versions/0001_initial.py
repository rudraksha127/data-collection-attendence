"""initial — users, students, student_submissions, student_photos, review_history, audit_events

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-09
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="STUDENT"),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("is_first_login", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "students",
        sa.Column("student_id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("college_email", sa.String(255), nullable=False, unique=True),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("scholar_number", sa.String(32), nullable=False, unique=True),
        sa.Column("roll_number", sa.String(32), nullable=True),
        sa.Column("department", sa.String(80), nullable=True),
        sa.Column("program", sa.String(80), nullable=True),
        sa.Column("academic_year", sa.String(20), nullable=True),
        sa.Column("semester", sa.String(10), nullable=True),
        sa.Column("year", sa.String(10), nullable=True),
        sa.Column("section", sa.String(10), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "student_submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("student_id", sa.String(36), nullable=True, index=True),
        sa.Column("submission_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(24), nullable=False, server_default="DRAFT"),
        sa.Column("active_key", sa.String(36), nullable=True, unique=True),
        sa.Column("form_data_json", sa.String(8000), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "active_key", name="u_submissions_one_active"),
    )

    op.create_table(
        "student_photos",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("submission_id", sa.String(36), sa.ForeignKey("student_submissions.id"), nullable=False, index=True),
        sa.Column("student_id", sa.String(36), nullable=True, index=True),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("content_type", sa.String(80), nullable=False, server_default="image/jpeg"),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sha256", sa.String(64), nullable=False, index=True),
        sa.Column("capture_mode", sa.String(32), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="VALID"),
        sa.Column("validation_reason", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("submission_id", "sequence_number", name="u_photo_slot"),
    )

    op.create_table(
        "review_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("submission_id", sa.String(36), sa.ForeignKey("student_submissions.id"), nullable=False, index=True),
        sa.Column("reviewer_user_id", sa.String(36), nullable=True),
        sa.Column("reviewer_name", sa.String(120), nullable=True),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("from_status", sa.String(24), nullable=False),
        sa.Column("to_status", sa.String(24), nullable=False),
        sa.Column("reason_code", sa.String(64), nullable=True),
        sa.Column("reason", sa.String(1000), nullable=True),
        sa.Column("submission_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("event_type", sa.String(64), nullable=False, index=True),
        sa.Column("actor_user_id", sa.String(36), nullable=True, index=True),
        sa.Column("actor_role", sa.String(20), nullable=True),
        sa.Column("entity_type", sa.String(40), nullable=True),
        sa.Column("entity_id", sa.String(36), nullable=True, index=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("review_history")
    op.drop_table("student_photos")
    op.drop_table("student_submissions")
    op.drop_table("students")
    op.drop_table("users")
