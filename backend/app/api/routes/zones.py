from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.zone import ZoneRead
from app.services.zone_service import (
    get_zone,
    list_zones,
    search_zones,
    zones_to_geojson,
)

router = APIRouter(
    prefix="/zones",
    tags=["Zones géographiques"],
)

ZoneLevel = Literal["region", "department", "commune"]


@router.get("/", response_model=list[ZoneRead])
def read_zones(
    level: ZoneLevel = Query(...),
    parent_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
):
    return list_zones(db, level, parent_id)


@router.get("/geojson")
def read_zones_geojson(
    level: ZoneLevel = Query(...),
    parent_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
):
    return zones_to_geojson(db, level, parent_id)


@router.get("/search", response_model=list[ZoneRead])
def search_geographic_zones(
    q: str = Query(..., min_length=2, max_length=100),
    level: ZoneLevel | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return search_zones(db, q, level, limit)


@router.get("/{zone_id}", response_model=ZoneRead)
def read_zone(
    zone_id: int,
    db: Session = Depends(get_db),
):
    zone = get_zone(db, zone_id)

    if zone is None:
        raise HTTPException(
            status_code=404,
            detail="Zone géographique introuvable.",
        )

    return zone