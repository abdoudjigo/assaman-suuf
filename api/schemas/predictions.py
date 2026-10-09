"""
Schémas de l'API Prédictions.
"""

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """Paramètres d'une campagne à estimer."""

    produit: str = Field(..., examples=["Mil"])
    region: str = Field(..., examples=["Kaolack"])
    superficie_ha: float = Field(..., gt=0, examples=[1000])
    annee: int = Field(..., ge=1960, le=2100, examples=[2015])
    saison: str = "Principale"
    systeme_production: str = "Pluvial"


class ClimatUtilise(BaseModel):
    """Climat utilisé pour la prédiction."""

    source: str  # observe | normale_region
    pluie_cumul_mm: float
    tavg_moyenne: float
    pluie_normale_mm: float
    station_utilisee: str


class Reperes(BaseModel):
    """Repères pour situer la prédiction."""

    rendement_moyen_historique_t_ha: float | None = None
    erreur_moyenne_test_t_ha: float | None = None


class PredictionResponse(BaseModel):
    """Réponse de la route de prédiction."""

    rendement_t_ha: float
    production_t: float
    climat: ClimatUtilise
    reperes: Reperes
    modele_version: str
    avertissements: list[str]


class PredictionOptions(BaseModel):
    """Valeurs acceptées, pour les listes déroulantes du dashboard."""

    produit: list[str]
    region: list[str]
    saison: list[str]
    systeme_production: list[str]
