from fastapi import APIRouter

from app.api.routes import (
    agroclimatic,
    health,
    zones,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(zones.router)
api_router.include_router(agroclimatic.router)