from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "assaman-suuf-geospatial",
    }


@router.get("/health/database")
def database_health(
    db: Session = Depends(get_db),
):
    db.execute(text("SELECT 1"))

    postgis_version = db.execute(
        text("SELECT PostGIS_Version()")
    ).scalar_one()

    return {
        "status": "ok",
        "database": "connected",
        "postgis_version": postgis_version,
    }