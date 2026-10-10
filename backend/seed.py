"""Idempotent seed script — creates the initial ADMIN and a demo STUDENT.

Usage (from backend/):
    python seed.py

Security: passwords are hashed with bcrypt before storage. The generated
temporary student password is printed to the console ONCE and never stored
in plaintext — it is the documented temporary credential format
(first 4 letters of the name in CAPS + 6-digit scholar number).
"""
import sys

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password, initial_password
from app.models import Student, User  # noqa: F401 (registers metadata)
from app.services.validation_service import normalize_email

ADMIN_EMAIL = "admin@college.edu"
ADMIN_PASSWORD = "Admin@12345"  # dev-only; change immediately in production

DEMO_STUDENT = {
    "email": "rudraksh.student@college.edu",
    "full_name": "Rudraksh",
    "scholar_number": "123456",
    "roll_number": "CS-2024-001",
    "department": "Computer Science",
    "program": "B.Tech",
    "academic_year": "2025-26",
    "semester": "5",
    "year": "3",
    "section": "A",
    "phone": "9876543210",
}


def main() -> int:
    Base.metadata.create_all(engine)  # SQLite dev path; use `alembic upgrade head` on PostgreSQL
    session = SessionLocal()
    try:
        # --- ADMIN ---
        existing_admin = session.scalar(select(User).where(User.email == ADMIN_EMAIL))
        if existing_admin is None:
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role="ADMIN",
                status="ACTIVE",
                is_first_login=False,
            )
            session.add(admin)
            session.commit()
            print(f"[seed] ADMIN created: {ADMIN_EMAIL} (password set via ADMIN_PASSWORD env/default)")
        else:
            print(f"[seed] ADMIN already exists: {ADMIN_EMAIL}")

        # --- DEMO STUDENT ---
        email = normalize_email(DEMO_STUDENT["email"])
        existing_student = session.scalar(select(User).where(User.email == email))
        if existing_student is None:
            temp_password = initial_password(DEMO_STUDENT["full_name"], DEMO_STUDENT["scholar_number"])
            user = User(
                email=email,
                password_hash=hash_password(temp_password),
                role="STUDENT",
                status="ACTIVE",
                is_first_login=True,
            )
            session.add(user)
            session.flush()  # obtain user.id

            student = Student(
                user_id=user.id,
                college_email=email,
                full_name=DEMO_STUDENT["full_name"],
                scholar_number=DEMO_STUDENT["scholar_number"],
                roll_number=DEMO_STUDENT["roll_number"],
                department=DEMO_STUDENT["department"],
                program=DEMO_STUDENT["program"],
                academic_year=DEMO_STUDENT["academic_year"],
                semester=DEMO_STUDENT["semester"],
                year=DEMO_STUDENT["year"],
                section=DEMO_STUDENT["section"],
                phone=DEMO_STUDENT["phone"],
                status="ACTIVE",
            )
            session.add(student)
            session.commit()
            print(f"[seed] STUDENT created: {email}")
            print(f"[seed]   temporary password (shown ONCE): {temp_password}")
        else:
            print(f"[seed] STUDENT already exists: {email}")

        return 0
    finally:
        session.close()


if __name__ == "__main__":
    sys.exit(main())
