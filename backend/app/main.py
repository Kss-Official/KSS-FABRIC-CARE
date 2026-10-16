from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.errors import AppException
from app.api.v1 import (
    auth,
    me,
    notifications,
    customer,
    payments,
    webhooks,
    agent,
    staff,
    admin,
    internal_jobs,
)


app = FastAPI(
    title="FabriCare API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "fields": exc.fields or {},
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for err in exc.errors():
        loc = ".".join(str(l) for l in err.get("loc", []))
        field_errors[loc] = err.get("msg")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "fields": field_errors,
            }
        },
    )


# Health check
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}


# Mount API v1 Routers
api_v1_router = FastAPI()

app.include_router(auth.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(customer.router, prefix="/api/v1")
app.include_router(customer.router, prefix="/api/v1/customer")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(agent.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(internal_jobs.router, prefix="/api/v1")
