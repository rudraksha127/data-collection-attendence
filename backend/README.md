# Student Data Collection — Backend (PROMPT 1)

Authoritative storage layer for the Student Data Collection PWA:
**collect → validate → store → admin review**. Modular monolith (no premature microservices).

## Stack

Python 3.13 · FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · JWT (PyJWT) + bcrypt · PostgreSQL (SQLite for local dev) · local-adapter object storage behind an abstraction

## Architecture

```
PWA (Next.js) → FastAPI routes → Service layer (state machine, validation) → Repository layer → PostgreSQL
                              ↘ StorageService (private object storage, signed URLs)
```

- **Business logic never lives in route handlers.** Transitions/editability are centralized in `SubmissionEditPolicy`.
- **The backend is the final authority** on validation, state transitions, counts and authorization. Client checks are UX only.
- Every response uses the uniform envelope: `{"success": true, "data": ...}` / `{"success": false, "error": {code, message, details}}`.
- Every state change is written to `audit_events`. Photos are never exposed publicly — only via short-lived signed URLs.

## Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, envelope exception handlers
│   ├── core/                # config, database, security (bcrypt+JWT), logging, exceptions
│   ├── api/routes/          # health, auth, students, submissions, admin
│   ├── models/              # user, student, submission, photo (+review history), audit
│   ├── schemas/             # pydantic request/response contracts (auth, student, submission, admin)
│   ├── services/            # auth, submission (state machine), validation, storage, audit
│   ├── repositories/        # admin queue queries
│   └── utils/
├── migrations/              # Alembic (0001_initial)
├── tests/                   # 47 tests: auth, IDOR, contract, state machine, idempotency, DB invariants
├── seed.py                  # idempotent: ADMIN + demo STUDENT (initial-password format)
├── requirements.txt
└── .env.example
```

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
cp .env.example .env          # adjust DATABASE_URL / JWT_SECRET_KEY / ALLOWED_ORIGINS

python seed.py                # creates admin@college.edu + demo student (prints temp password ONCE)
uvicorn app.main:app --reload --port 8000
```

- SQLite dev DB is auto-created on startup; for PostgreSQL run `alembic upgrade head` instead.
- API docs: `http://localhost:8000/docs`
- CORS: allow your PWA origin via `ALLOWED_ORIGINS` (default `http://localhost:3000`).

### Seed credentials (dev only)

| Role    | Email                       | Password                                      |
|---------|-----------------------------|-----------------------------------------------|
| ADMIN   | `admin@college.edu`         | `Admin@12345` (change via `ADMIN_PASSWORD`)   |
| STUDENT | `rudraksh.student@college.edu` | `RUDR123456` (first 4 name letters CAPS + 6-digit scholar number) |

Passwords are stored only as bcrypt hashes; the student's temporary credential follows the
institutional format and is replaced via `POST /api/v1/auth/change-password`.

## Tests

```bash
cd backend
python -m pytest tests -q
```

Covers: login contract + rate limiting, credential rotation, **IDOR guards** (cross-student 404s,
admin positive control, role enforcement), response/error envelopes, CORS preflight, photo
upload + signed-URL delivery, the full submission **state machine** (incl. the
NEEDS_CORRECTION → resubmit loop), **approval idempotency** + stale-version conflicts, and DB
invariants (uniqueness, email normalization, stable `student_id`).

## Configuration (`.env`)

| Key | Default | Notes |
|-----|---------|-------|
| `DATABASE_URL` | `sqlite:///./backend.db` | use `postgresql+psycopg2://…` in production |
| `JWT_SECRET_KEY` | `change-me-in-production` | **must** change in production |
| `ACCESS_TOKEN_TTL_MINUTES` | 480 | short-lived access credential |
| `STORAGE_ROOT` | `./storage` | swap `LocalStorageAdapter` for S3-compatible later |
| `PHOTO_MIN` / `PHOTO_MAX` | 6 / 8 | backend-configured; frontend reads via `/submissions/form-config` |
| `ALLOWED_ORIGINS` | `http://localhost:3000,…` | comma-separated PWA origin(s) |
