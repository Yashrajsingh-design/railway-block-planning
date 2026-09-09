from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.requests import router as requests_router
from app.api.database import router as database_router
from app.api.precheck import router as precheck_router
app = FastAPI(
    title="Indian Railways Automatic Block Planning API",
    description=(
        "Backend API for AI-assisted maintenance block planning "
        "for Indian Railways."
    ),
    version="0.1.0",
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

app.include_router(precheck_router, prefix="/api/v1")