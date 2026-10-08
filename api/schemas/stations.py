"""
Schémas de réponse de l'API Stations.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class StationItem(BaseModel):
    """Une station climatique."""

    station_key: Optional[str] = None
    station: Optional[str] = None
    station_nom: Optional[str] = None

    zone_key: Optional[str] = None
    region: Optional[str] = None


class StationResponse(BaseModel):
    """Réponse de la route Stations."""

    data: list[StationItem]
    pagination: Pagination
