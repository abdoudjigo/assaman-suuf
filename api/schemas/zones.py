"""
Schémas de réponse de l'API Zones.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class ZoneItem(BaseModel):
    """Une zone géographique."""

    zone_key: Optional[str] = None
    region: Optional[str] = None


class ZoneResponse(BaseModel):
    """Réponse de la route Zones."""

    data: list[ZoneItem]
    pagination: Pagination
