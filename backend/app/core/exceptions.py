"""API error type and the uniform response envelope.

Success:  {"success": true,  "data": ...}
Error:    {"success": false, "error": {"code": "...", "message": "...", "details": {...}}}
"""
from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: dict | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details

    def to_response(self) -> JSONResponse:
        return JSONResponse(
            status_code=self.status_code,
            content={
                "success": False,
                "error": {"code": self.code, "message": self.message, "details": self.details},
            },
        )


def ok(data, status_code: int = 200) -> JSONResponse:
    """Uniform success envelope."""
    return JSONResponse(status_code=status_code, content={"success": True, "data": data})


# Common error constructors (stable codes, never raw string comparison in clients)
def unauthorized(message: str = "Authentication required.") -> ApiError:
    return ApiError(401, "UNAUTHORIZED", message)


def invalid_credentials() -> ApiError:
    # Generic — must not reveal whether the email exists
    return ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.")


def forbidden(message: str = "You do not have access to this resource.") -> ApiError:
    return ApiError(403, "FORBIDDEN", message)


def not_found(resource: str = "Resource") -> ApiError:
    return ApiError(404, "NOT_FOUND", f"{resource} not found.")


def conflict(code: str, message: str) -> ApiError:
    return ApiError(409, code, message)


def validation_failed(message: str, details: dict | None = None) -> ApiError:
    return ApiError(422, "VALIDATION_FAILED", message, details)


def rate_limited() -> ApiError:
    return ApiError(429, "TOO_MANY_REQUESTS", "Too many attempts. Try again later.")


# HTTP status → stable code for framework-raised errors (404 routing, 405, etc.)
ERROR_CODES: dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_ERROR",
    429: "TOO_MANY_REQUESTS",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
}
