"""
Schémas de réponse de l'API Climat.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class ClimatItem(BaseModel):
    """Une observation climatique station × mois."""

    observation_id: Optional[str] = None

    station_key: Optional[str] = None
    station: Optional[str] = None
    station_nom: Optional[str] = None

    zone_key: Optional[str] = None
    region: Optional[str] = None

    date_key: Optional[int] = None
    annee: Optional[int] = None
    mois: Optional[int] = None
    nom_mois: Optional[str] = None
    trimestre: Optional[int] = None
    est_hivernage: Optional[bool] = None

    tavg: Optional[float] = None
    tmin: Optional[float] = None
    tmax: Optional[float] = None
    prcp_mm: Optional[float] = None
    nb_jours: Optional[int] = None


class ClimatResponse(BaseModel):
    """Réponse de la route Climat."""

    data: list[ClimatItem]
    pagination: Pagination