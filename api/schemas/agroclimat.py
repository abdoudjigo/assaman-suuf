"""
Schémas de réponse de l'API Agroclimat.
"""

from pydantic import BaseModel

from schemas.common import Pagination


class AgroclimatItem(BaseModel):
    """Une campagne agricole enrichie par les indicateurs climatiques."""

    observation_id: str | None = None

    zone_key: str | None = None
    produit_key: str | None = None
    fnid: str | None = None

    region: str | None = None
    departement: str | None = None
    produit: str | None = None
    categorie: str | None = None

    annee: int | None = None
    saison: str | None = None
    systeme_production: str | None = None

    mois_semis: int | None = None
    mois_recolte: int | None = None
    duree_campagne_mois: int | None = None

    indicateur_qualite: int | None = None

    superficie_ha: float | None = None
    production_t: float | None = None
    rendement_t_ha: float | None = None

    a_climat: bool | None = None
    nb_mois_climat: int | None = None
    taux_couverture_climat: float | None = None

    pluie_cumul_mm: float | None = None
    pluie_mois_max_mm: float | None = None
    nb_mois_secs: int | None = None
    pluie_anomalie_mm: float | None = None

    tavg_moyenne: float | None = None
    tmax_max: float | None = None
    tmin_min: float | None = None
    tavg_anomalie: float | None = None

    source_system: str | None = None


class AgroclimatResponse(BaseModel):
    """Réponse de la route Agroclimat."""

    data: list[AgroclimatItem]
    pagination: Pagination
