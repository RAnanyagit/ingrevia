from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import OperationalError
from starlette.exceptions import HTTPException as StarletteHTTPException


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": "HTTPException",
            "message": exc.detail,
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "ValidationError",
            "message": exc.errors(),
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    # Specialized message for database cold starts
    if isinstance(exc, OperationalError):
        return JSONResponse(
            status_code=503, # Service Unavailable
            content={
                "success": False,
                "error": "DatabaseWakingUp",
                "message": "The database is currently waking up from sleep. This usually takes about 60 seconds on the first run. Please wait a moment and try again.",
            },
        )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "InternalServerError",
            "message": "An unexpected error occurred.",
        },
    )
