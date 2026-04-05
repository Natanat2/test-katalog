from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _http_exception_payload(exc: HTTPException) -> dict[str, object]:
    if isinstance(exc.detail, dict):
        detail = exc.detail.get("detail", "Request error")
        code = exc.detail.get("code", f"http_{exc.status_code}")
        payload: dict[str, object] = {
            "detail": str(detail),
            "code": str(code),
        }
        if "fields" in exc.detail:
            payload["fields"] = exc.detail["fields"]
        return payload

    return {
        "detail": str(exc.detail),
        "code": f"http_{exc.status_code}",
    }


def _validation_payload(exc: RequestValidationError) -> dict[str, object]:
    fields: dict[str, str] = {}
    for err in exc.errors():
        location = ".".join(str(part) for part in err["loc"] if part != "body")
        key = location if location else "body"
        fields[key] = err["msg"]

    return {
        "detail": "Validation error",
        "code": "validation_error",
        "fields": fields,
    }


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def handle_http_exception(_: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_http_exception_payload(exc),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=_validation_payload(exc),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal server error",
                "code": "internal_error",
            },
        )
