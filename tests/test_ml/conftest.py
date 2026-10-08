"""Données synthétiques au format de ML_RENDEMENT_CAMPAGNE et modèle entraîné dessus."""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

REGIONS_AVEC_STATION = ["Kaolack", "Kolda", "Thies"]
REGIONS_SANS_STATION = ["Kaffrine", "Fatick", "Sedhiou"]


@pytest.fixture
def dataset():
    """Campagnes 1990-2015 ; le rendement augmente avec la pluie."""
    rng = np.random.default_rng(0)
    lignes = []
    for annee in range(1990, 2016):
        for region in REGIONS_AVEC_STATION + REGIONS_SANS_STATION:
            a_climat = region in REGIONS_AVEC_STATION
            pluie = float(rng.uniform(200, 900)) if a_climat else np.nan
            for produit in ["Mil", "Arachide (en coque)"]:
                for _ in range(3):
                    base = 0.6 if produit == "Mil" else 0.9
                    lignes.append(
                        {
                            "observation_id": f"obs{len(lignes)}",
                            "annee": annee,
                            "produit": produit,
                            "region": region,
                            "saison": "Principale",
                            "systeme_production": None if annee % 2 else "Pluvial",
                            "superficie_ha": float(rng.uniform(100, 5000)),
                            "a_climat": a_climat,
                            "pluie_cumul_mm": pluie,
                            "tavg_moyenne": 28.0 if a_climat else np.nan,
                            "cible_rendement_t_ha": base
                            + 0.001 * (np.nan_to_num(pluie, nan=500) - 500)
                            + float(rng.normal(0, 0.05)),
                            "jeu": "train" if annee <= 2010 else "test",
                        }
                    )
    return pd.DataFrame(lignes)


@pytest.fixture
def modele_entraine(dataset, tmp_path, monkeypatch):
    """Entraîne le modèle sur le dataset synthétique, dans un dossier temporaire."""
    from ml.scripts import entrainement, simulation

    fichier = tmp_path / "export.parquet"
    dataset.to_parquet(fichier)
    monkeypatch.setattr(entrainement, "DOSSIER_MODELES", tmp_path)
    monkeypatch.setattr(entrainement, "FICHIER_MODELE", tmp_path / "modele.pkl")
    monkeypatch.setattr(entrainement, "FICHIER_METRIQUES", tmp_path / "metriques.json")
    monkeypatch.setattr(simulation, "FICHIER_MODELE", tmp_path / "modele.pkl")
    simulation.charger_modele.cache_clear()
    resume = entrainement.executer(fichier)
    yield resume
    simulation.charger_modele.cache_clear()
