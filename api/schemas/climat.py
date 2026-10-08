"""
Schémas de réponse de l'API Climat.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class ClimatItem(BaseModel):
    """Une observation climatique station × mois."""

    observation_id: str | None = None

    station_key: str | None = None
    station: str | None = None
    station_nom: str | None = None

    zone_key: str | None = None
    region: str | None = None

    date_key: int | None = None
    annee: int | None = None
    mois: int | None = None
    nom_mois: str | None = None
    trimestre: int | None = None
    est_hivernage: bool | None = None

    tavg: float | None = None
    tmin: float | None = None
    tmax: float | None = None
    prcp_mm: float | None = None
    nb_jours: int | None = None


class ClimatResponse(BaseModel):
    """Réponse de la route Climat."""

    data: list[ClimatItem]
    pagination: Pagination
