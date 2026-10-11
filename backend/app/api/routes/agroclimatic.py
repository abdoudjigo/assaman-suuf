from fastapi import APIRouter

from app.services.agroclimatic_client import (
    check_agroclimatic_api,
)

router = APIRouter(
    prefix="/agroclimatic",
    tags=["Intégration agroclimatique"],
)


@router.get("/status")
async def agroclimatic_status():
    return await check_agroclimatic_api()