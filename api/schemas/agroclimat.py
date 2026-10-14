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


class AgroclimatAgregatItem(BaseModel):
    """
    Agrégat de campagnes pour une valeur de regroupement.

    Les valeurs null sont ignorées (jamais comptées comme 0) et le rendement
    est un ratio de sommes, calculé sur les campagnes ayant à la fois une
    production et une superficie renseignées.
    """

    cle: str | int | None = None

    nb_campagnes: int
    production_t: float | None = None
    superficie_ha: float | None = None

    nb_campagnes_rendement: int
    rendement_t_ha: float | None = None

    nb_avec_climat: int
    nb_climat_renseigne: int
    couverture_climat_pct: float | None = None


class AgroclimatAgregatResponse(BaseModel):
    """Réponse de la route d'agrégats Agroclimat."""

    group_by: str
    data: list[AgroclimatAgregatItem]


class AgroclimatNuagePoint(BaseModel):
    """Une campagne avec climat : pluie cumulée et rendement."""

    pluie_cumul_mm: float
    rendement_t_ha: float
    produit: str
    region: str | None = None
    annee: int | None = None


class AgroclimatNuageResponse(BaseModel):
    """Réponse de la route nuage de points Agroclimat."""

    total: int
    data: list[AgroclimatNuagePoint]
