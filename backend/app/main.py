from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.analytics.router import router as analytics_router
from app.attendance.router import router as attendance_router
from app.auth.router import router as auth_router
from app.errors import AppError, app_error_handler, http_error_handler, unhandled_error_handler, validation_error_handler
from app.fraud.router import router as fraud_router
from app.hr.router import router as hr_router
from app.ml.router import router as ml_router
from app.payroll.router import router as payroll_router
from app.worker.router import router as worker_router

app = FastAPI(title="GhostGuard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(worker_router)
app.include_router(attendance_router)
app.include_router(fraud_router)
app.include_router(ml_router)
app.include_router(hr_router)
app.include_router(payroll_router)
app.include_router(analytics_router)


@app.get("/health")
async def health_check():
    return {"success": True, "data": {"status": "ok"}, "message": "GhostGuard API is healthy."}
