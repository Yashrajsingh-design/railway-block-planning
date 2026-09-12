
from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.requests import router as requests_router
from app.api.database import router as database_router
from app.api.precheck import router as precheck_router
from app.api.priority import router as priority_router
from app.api.candidate_windows import router as candidate_windows_router
from app.api.optimization import router as optimization_router
from app.api.plan_explanations import router as plan_explanations_router
from app.api.plan_comparison import router as plan_comparison_router
from app.api.dashboard import router as dashboard_router
from fastapi.middleware.cors import CORSMiddleware
from app.api.plan_lifecycle import router as plan_lifecycle_router



app = FastAPI(
    title="Indian Railways Automatic Block Planning API",
    description=(
        "Backend API for AI-assisted maintenance block planning "
        "for Indian Railways."
    ),
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    health_router,
    prefix="/api/v1",
)

app.include_router(
    requests_router,
    prefix="/api/v1",
)

app.include_router(
    database_router,
    prefix="/api/v1",
)

app.include_router(priority_router, prefix="/api/v1")
app.include_router(
    candidate_windows_router,
    prefix="/api/v1",
)
app.include_router(
    optimization_router,
    prefix="/api/v1",
)

app.include_router(
    precheck_router, prefix="/api/v1")

app.include_router(plan_explanations_router)
app.include_router(plan_comparison_router)

app.include_router(dashboard_router)

app.include_router(
    plan_lifecycle_router,
    prefix="/api/v1/plans",
    tags=["plans"],
)