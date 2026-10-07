"""
Schémas de réponse de l'API Agroclimat.
"""

from typing import Optional

from pydantic import BaseModel

from schemas.common import Pagination


class AgroclimatItem(BaseModel):
    """Une campagne agricole enrichie par les indicateurs climatiques."""

    observation_id: Optional[str] = None

    zone_key: Optional[str] = None
    produit_key: Optional[str] = None
    fnid: Optional[str] = None

    region: Optional[str] = None
    departement: Optional[str] = None
    produit: Optional[str] = None
    categorie: Optional[str] = None

    annee: Optional[int] = None
    saison: Optional[str] = None
    systeme_production: Optional[str] = None

    mois_semis: Optional[int] = None
    mois_recolte: Optional[int] = None
    duree_campagne_mois: Optional[int] = None

    indicateur_qualite: Optional[int] = None

    superficie_ha: Optional[float] = None
    production_t: Optional[float] = None
    rendement_t_ha: Optional[float] = None

    a_climat: Optional[bool] = None
    nb_mois_climat: Optional[int] = None
    taux_couverture_climat: Optional[float] = None

    pluie_cumul_mm: Optional[float] = None
    pluie_mois_max_mm: Optional[float] = None
    nb_mois_secs: Optional[int] = None
    pluie_anomalie_mm: Optional[float] = None

    tavg_moyenne: Optional[float] = None
    tmax_max: Optional[float] = None
    tmin_min: Optional[float] = None
    tavg_anomalie: Optional[float] = None

    source_system: Optional[str] = None


class AgroclimatResponse(BaseModel):
    """Réponse de la route Agroclimat."""

    data: list[AgroclimatItem]
    pagination: Pagination
