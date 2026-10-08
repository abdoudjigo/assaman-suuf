"""
Schémas de réponse de l'API Stations.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class StationItem(BaseModel):
    """Une station climatique."""

    station_key: str | None = None
    station: str | None = None
    station_nom: str | None = None

    zone_key: str | None = None
    region: str | None = None


class StationResponse(BaseModel):
    """Réponse de la route Stations."""

    data: list[StationItem]
    pagination: Pagination
