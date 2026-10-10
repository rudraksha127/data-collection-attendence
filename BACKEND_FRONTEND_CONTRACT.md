# BACKEND ↔ FRONTEND CONTRACT (PROMPT 1)

Source of truth for what the backend serves and what the PWA
(`frontend/src/lib/api/client.ts` + `endpoints.ts` + `types/api.ts`) consumes.
The backend is authoritative: it owns validation, state transitions, counts and authorization.

---

## 1. Conventions

### Success envelope
```json
{ "success": true, "data": { ... } }
```
### Error envelope (stable codes — never compare raw strings)
```json
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "...", "details": { "field": ["msg"] } } }
```
`details` is `Record<string, string[]>` per-field messages where applicable.

### Codes used
`UNAUTHORIZED` `INVALID_CREDENTIALS` `FORBIDDEN` `NOT_FOUND` `CONFLICT` `SUBMISSION_LOCKED`
`CONCURRENT_UPDATE` `REVIEW_VERSION_STALE` `VALIDATION_FAILED` `PHOTO_REQUIRED` `PHOTO_INVALID`
`TOO_MANY_REQUESTS` `ACCOUNT_DISABLED` `INTERNAL_ERROR`

### Authentication
- `Authorization: Bearer <access_token>` on every non-login request (JWT, short-lived).
- Token stored by the PWA in `sessionStorage` under `auth.access_token`; 401 clears the session.
- Temporary student credential: **first 4 letters of name in CAPS + 6-digit scholar number**
  (`RUDR123456`), replaced via `POST /auth/change-password`. Never stored/returned/logged in plaintext.

---

## 2. Field mapping

### Form data (submission draft → canonical student record on approval)

| Frontend form field | Backend field | Type | Required | Validation (server-authoritative) |
|---|---|---|---|---|
| Full Name | `full_name` | string | ✅ | 1–120 chars, no control chars, whitespace collapsed |
| College Email | `email` | string | ✅ | RFC-like format; **normalized to lowercase** before storage/uniqueness |
| Phone | `phone` | string | ✅ | exactly 10 digits (spaces/dashes stripped) |
| Roll Number | `roll_number` | string | ✅ | ≤ 32 chars |
| Department | `department` | string | ✅ | ≤ 80 chars |
| Semester | `semester` | string | ✅ | ≤ 10 chars |
| Section | `section` | string | ✅ | ≤ 10 chars |
| Program | `program` | string | optional | ≤ 80 chars |
| Academic Year | `academic_year` | string | optional | ≤ 20 chars |
| Year | `year` | string | optional | ≤ 10 chars |

Unknown extra scalar keys pass through the typed mapping layer (no renames, no invented fields).

### Users (`users`)
`id` (UUID, internal PK — never the email) · `email` (unique, normalized) · `password_hash`
(bcrypt) · `role` (`STUDENT`|`ADMIN`, extensible) · `status` (`PENDING`|`ACTIVE`|`SUSPENDED`|`DISABLED`)
· `is_first_login` · `last_login_at` · timestamps.

### Students (`students`) — canonical record
`student_id` (UUID, **stable internal identity** — never changes on section/roll/year/email change)
· `user_id` → users · `college_email` (unique) · `full_name` · `scholar_number` (unique per institution)
· `roll_number` · `department` · `program` · `academic_year` · `semester` · `year` · `section`
· `phone` · `status` · timestamps.

### Submissions (`student_submissions`) — separate from the student record
`id` · `user_id` · `student_id` (set once provisioned) · `submission_version` (optimistic concurrency;
every mutation bumps it) · `status` · `form_data_json` · `active_key` (one active submission per user)
· `submitted_at` · timestamps.

Status flow (state machine, server-enforced):

```
DRAFT ─────────────► SUBMITTED ──► UNDER_REVIEW ──► APPROVED (terminal; writes students table)
NEEDS_CORRECTION ─►      │              │
        ▲                └──► REJECTED (terminal) / NEEDS_CORRECTION ──► (student edits, resubmits)
        └──────────────────────────────┘
```
`available_actions` (student): `edit`/`submit` in DRAFT & NEEDS_CORRECTION, else none.
`admin_actions`: review actions in SUBMITTED & UNDER_REVIEW.

### Photos (`student_photos`)
`id` · `submission_id` · `sequence_number` (1..PHOTO_MAX) · `content_type` (JPEG/PNG/WebP only)
· `size_bytes` (≤ 5 MB) · `sha256` (integrity + idempotent re-upload) · `capture_mode`
· `status` (`VALID`) · `validation_reason` · timestamps.
Photo slot count comes from the backend: `GET /submissions/form-config` → `{photo_min: 6, photo_max: 8, ...}`.

---

## 3. Endpoints (as consumed by `endpoints.ts`)

| Method & path | Request | Response `data` |
|---|---|---|
| `POST /api/v1/auth/login` | `{email, password}` | `{user: {id,email,role,status,is_first_login}, access_token, token_type:"bearer"}` |
| `POST /api/v1/auth/logout` | — | `{logged_out: true}` |
| `GET /api/v1/auth/me` | Bearer | user object above |
| `POST /api/v1/auth/change-password` | `{current_password, new_password}` | `{password_changed: true}` |
| `GET\|PATCH /api/v1/students/me` | Bearer / profile patch | `{id, user_id, full_name, email, college_email, scholar_number, roll_number, department, program, academic_year, semester, year, section, phone, status}` |
| `POST /api/v1/submissions` | `{}` | Submission (creates DRAFT; 409 if one active) |
| `GET /api/v1/submissions/me` | Bearer | Submission, or 404 `NOT_FOUND` (frontend: `.catch(() => null)`) |
| `GET /api/v1/submissions/{id}` | Bearer (owner only) | Submission |
| `PATCH /api/v1/submissions/{id}` | `{form_data, version}` | Submission |
| `POST /api/v1/submissions/{id}/submit` | `{version}` | Submission |
| `POST /api/v1/submissions/{id}/photos` | multipart: `file`, `sequence_number`, `capture_mode` | `{id, sequence_number, status, capture_mode, validation: {valid, reason_code, reason}}` |
| `DELETE /api/v1/submissions/{id}/photos/{photo_id}` | Bearer | `{deleted: true}` |
| `GET /api/v1/submissions/{id}/photos/{photo_id}/url` | Bearer | `{url, expires_in}` — signed URL |
| `GET /api/v1/submissions/{id}/photos/{photo_id}/download?token=…` | signed token | image bytes |
| `GET /api/v1/submissions/form-config` | — | `{photo_min, photo_max, required_fields, statuses}` |
| `GET /api/v1/admin/submissions?page&page_size&status&search&sort_by&sort_order` | Admin | `{items:[{id,status,version,student:{id,full_name,roll_no,department},photo_count,submitted_at,updated_at}], page, page_size, total}` |
| `GET /api/v1/admin/submissions/summary` | Admin | `{pending, under_review, needs_correction, approved, rejected}` |
| `GET /api/v1/admin/submissions/{id}` | Admin | Submission + `student_profile`, `reviews[]`, `admin_actions` |
| `POST /api/v1/admin/submissions/{id}/start-review` | `{version}` | detail (above) |
| `POST /api/v1/admin/submissions/{id}/approve` | `{version}` | detail — **idempotent** |
| `POST /api/v1/admin/submissions/{id}/reject` | `{version, reason_code( required ), reason}` | detail — idempotent |
| `POST /api/v1/admin/submissions/{id}/request-correction` | `{version, reason_code(required), reason}` | detail — idempotent |
| `GET /api/v1/admin/audit?limit` | Admin | audit events |
| `GET /api/v1/health[/readiness]` | — | `{status, ...}` |

### Concurrency & idempotency rules
- Every mutation sends the last-known `version`. A stale version → `409 CONCURRENT_UPDATE` /
  `409 REVIEW_VERSION_STALE` — **no state change occurs**.
- Repeating approve/reject/request-correction (even with the original version) is safe: the
  terminal state is returned unchanged, history gains exactly one entry.

### Authorization / IDOR
- Identity always comes from the token — never from the payload or URL.
- A student touching another student's submission/photo gets **404** (existence is not leaked).
- Admin endpoints require `role=ADMIN` (else 403 `FORBIDDEN`). Frontend `RequireRole` is UX only.

### Photo delivery
Images never hit public storage: `GET …/url` returns a signed, expiring URL; `…/download`
validates it (no session header needed — that's how `<img>` tags fetch bytes).

### CORS
PWA origin(s) configured via `ALLOWED_ORIGINS`; preflight answered with
`Access-Control-Allow-Origin: <origin>` + `Allow-Headers: content-type, authorization`.
