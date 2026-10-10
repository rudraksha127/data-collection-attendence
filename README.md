# data-collection-attendence

Production Next.js frontend + FastAPI backend for the student data-collection & attendance system, built from the Google Stitch design source of truth (`stitch_faculty_student_count_app/`).

- `frontend/` — Next.js PWA (this repo's UI)
- `backend/` — FastAPI modular monolith (PROMPT 1: collect → validate → store → admin review) — see `backend/README.md`
- `BACKEND_FRONTEND_CONTRACT.md` — the field/endpoint/error contract both sides implement

## Stack

- Next.js 16 (App Router) + React 19 + strict TypeScript
- Tailwind CSS v4 with the Stitch design tokens (colors, typography, spacing in `src/app/globals.css`)
- PWA: manifest + icons + mobile viewport behavior

## Structure

- `frontend/src/app` — routes: `/login`, `/student/*` (registration flow, dashboard), `/admin/*` (submission queue, review detail)
- `frontend/src/lib/api` — centralized API client (`client.ts`) + typed endpoints (`endpoints.ts`)
- `frontend/src/lib/auth` — `AuthProvider` / `useAuth`, 401 handling
- `frontend/src/components` — Stitch UI components (headers, stepper, form fields, status badge, camera capture)
- `frontend/src/types/api.ts` — typed request/response contract
- `stitch_faculty_student_count_app/` — original Stitch design source (HTML + DESIGN.md); design source of truth

## Run locally

```bash
cd frontend
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL to your backend
npm install
npm run build
npm start                          # serves http://localhost:3000
```

Dev mode: `npm run dev`.

## API contract

All requests go through `lib/api/client.ts` using `NEXT_PUBLIC_API_BASE_URL` (never hard-coded). Backend routes implemented against PROMPT 1's FINAL API GROUP:

- Auth: `POST /api/v1/auth/login|logout|change-password`, `GET /api/v1/auth/me`
- Student: `GET|PATCH /api/v1/students/me`
- Submission: `POST /api/v1/submissions`, `GET /api/v1/submissions/me`, `GET|PATCH /api/v1/submissions/{id}`, `POST .../submit`
- Photos: `POST|DELETE /api/v1/submissions/{id}/photos`, `GET .../photos/{photo_id}/url`
- Admin: `GET /api/v1/admin/submissions[/{id}]`, `POST .../approve|reject|request-correction|start-review`

Auth token is held in sessionStorage (short-lived access token); the backend remains the authorization authority — frontend route guards (`RequireRole`) are UX only.
