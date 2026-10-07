"""
Schémas de réponse de l'API Agriculture.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class AgricultureItem(BaseModel):
    """Une observation/campagne agricole."""

    observation_id: Optional[str] = None
    zone_key: Optional[str] = None
    produit_key: Optional[str] = None
    fnid: Optional[str] = None

    region: Optional[str] = None
    departement: Optional[str] = None
    produit: Optional[str] = None
    categorie: Optional[str] = None

    saison: Optional[str] = None
    annee_semis: Optional[int] = None
    mois_semis: Optional[int] = None
    annee_recolte: Optional[int] = None
    mois_recolte: Optional[int] = None

    systeme_production: Optional[str] = None
    indicateur_qualite: Optional[int] = None

    superficie_ha: Optional[float] = None
    production_t: Optional[float] = None
    rendement_t_ha: Optional[float] = None

    source_system: Optional[str] = None


class AgricultureResponse(BaseModel):
    """Réponse de la route Agriculture."""

    data: list[AgricultureItem]
    pagination: Pagination