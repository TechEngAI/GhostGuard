from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "Success.") -> dict[str, Any]:
    """Build a successful API envelope."""

    return {"success": True, "data": data if data is not None else {}, "message": message}


def error_response(code: str, message: str, field: str | None = None, data: Any = None) -> dict[str, Any]:
    """Build an error API envelope."""

    error: dict[str, Any] = {"code": code, "message": message}
    if field:
        error["field"] = field
    if data is not None:
        error["data"] = data
    return {"success": False, "error": error}


class AppError(HTTPException):
    """HTTP exception with GhostGuard's consistent JSON error format."""

    def __init__(self, status_code: int, code: str, message: str, field: str | None = None, data: Any = None):
        super().__init__(status_code=status_code, detail=error_response(code, message, field, data))


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    """Render application errors."""

    return JSONResponse(status_code=exc.status_code, content=exc.detail)


async def http_error_handler(_: Request, exc: HTTPException) -> JSONResponse:
    """Render framework HTTP errors in the standard envelope."""

    if isinstance(exc.detail, dict) and exc.detail.get("success") is False:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    message = str(exc.detail) if exc.detail else "Request failed."
    return JSONResponse(status_code=exc.status_code, content=error_response("HTTP_ERROR", message))


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    """Render Pydantic validation errors in the standard envelope."""

    first_error = exc.errors()[0] if exc.errors() else {}
    location = first_error.get("loc", [])
    field = str(location[-1]) if location else None
    message = first_error.get("msg", "Invalid request payload.")
    return JSONResponse(
        status_code=422,
        content=error_response("VALIDATION_ERROR", message, field),
    )


async def unhandled_error_handler(_: Request, __: Exception) -> JSONResponse:
    """Render unexpected errors without leaking internal details."""

    return JSONResponse(status_code=500, content=error_response("INTERNAL_SERVER_ERROR", "An unexpected error occurred."))
