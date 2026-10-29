from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        fields: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.fields = fields or {}


# Alias
AppException = AppError


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict occurred", fields: Optional[Dict[str, Any]] = None):
        code = fields.get("code", "CONFLICT") if fields else "CONFLICT"
        super().__init__(code=code, message=message, status_code=409, fields=fields)


class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed", fields: Optional[Dict[str, Any]] = None):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422, fields=fields)


class InvalidTransitionError(AppError):
    def __init__(self, message: str = "Invalid status transition", expected: Optional[str] = None):
        fields = {"expected": expected} if expected else {}
        super().__init__(code="INVALID_TRANSITION", message=message, status_code=409, fields=fields)


class InvalidOTPError(AppError):
    def __init__(self, message: str = "Invalid or expired OTP"):
        super().__init__(code="INVALID_OTP", message=message, status_code=400)


class PaymentFailedError(AppError):
    def __init__(self, message: str = "Payment failed"):
        super().__init__(code="PAYMENT_FAILED", message=message, status_code=400)


class OrderNotPayableError(AppError):
    def __init__(self, message: str = "Order is not payable"):
        super().__init__(code="ORDER_NOT_PAYABLE", message=message, status_code=409)


class RateLimitedError(AppError):
    def __init__(self, message: str = "Too many requests. Please try again later.", fields: Optional[Dict[str, Any]] = None):
        super().__init__(code="RATE_LIMITED", message=message, status_code=429, fields=fields)


RateLimitError = RateLimitedError


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "fields": exc.fields
            }
        }
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = {}
    for err in exc.errors():
        loc = ".".join(str(l) for l in err.get("loc", []) if l != "body")
        errors[loc] = err.get("msg", "Invalid value")

    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed for request parameters",
                "fields": errors
            }
        }
    )
