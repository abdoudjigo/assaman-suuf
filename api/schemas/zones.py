"""
Schémas de réponse de l'API Zones.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class ZoneItem(BaseModel):
    """Une zone géographique."""

    zone_key: str | None = None
    region: str | None = None


class ZoneResponse(BaseModel):
    """Réponse de la route Zones."""

    data: list[ZoneItem]
    pagination: Pagination
