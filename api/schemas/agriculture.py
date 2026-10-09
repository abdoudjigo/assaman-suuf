"""
Schémas de réponse de l'API Agriculture.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class AgricultureItem(BaseModel):
    """Une observation/campagne agricole."""

    observation_id: str | None = None
    zone_key: str | None = None
    produit_key: str | None = None
    fnid: str | None = None

    region: str | None = None
    departement: str | None = None
    produit: str | None = None
    categorie: str | None = None

    saison: str | None = None
    annee_semis: int | None = None
    mois_semis: int | None = None
    annee_recolte: int | None = None
    mois_recolte: int | None = None

    systeme_production: str | None = None
    indicateur_qualite: int | None = None

    superficie_ha: float | None = None
    production_t: float | None = None
    rendement_t_ha: float | None = None

    source_system: str | None = None


class AgricultureResponse(BaseModel):
    """Réponse de la route Agriculture."""

    data: list[AgricultureItem]
    pagination: Pagination
