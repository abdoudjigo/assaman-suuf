"""Entraînement et simulation du rendement."""

import pytest

from ml.scripts import simulation
from ml.scripts.entrainement import choisir_modele


def test_entrainement_bat_la_baseline(modele_entraine):
    test = modele_entraine["test"]
    assert test["modele"]["mae"] < test["baseline_region_produit"]["mae"]


def test_regle_de_choix_du_modele(monkeypatch):
    from ml.scripts import entrainement

    scores = iter([0.60, 0.55, 0.50, 0.58])
    monkeypatch.setattr(
        entrainement, "CANDIDATS", {"lineaire": [None], "ridge": [1.0, 10.0], "lasso": [0.01]}
    )
    monkeypatch.setattr(entrainement, "construire_modele", lambda n, a: _Faux())
    monkeypatch.setattr(entrainement, "metriques", lambda r, p: {"mae": next(scores)})
    import pandas as pd

    train = pd.DataFrame({"annee": [2000, 2008], "cible_rendement_t_ha": [1, 1]})
    for c in entrainement.FEATURES:
        train[c] = 0
    # Ridge alpha=10 a la plus petite MAE de validation (0.50).
    choix, scores_validation = choisir_modele(train)
    assert choix == ("ridge", 10.0)
    assert scores_validation["ridge (alpha=10)"] == 0.50


class _Faux:
    def fit(self, X, y):
        return self

    def predict(self, X):
        return [0] * len(X)


def test_simulation_normale_par_defaut(modele_entraine):
    r = simulation.simuler("Mil", "Kaolack", 1000, 2027)
    assert r["climat"]["source"] == "normale_region"
    assert r["production_t"] == pytest.approx(r["rendement_t_ha"] * 1000, rel=1e-2)


def test_simulation_priorite_du_climat(modele_entraine):
    observe = {"pluie_cumul_mm": 700.0, "tavg_moyenne": 27.0}
    r = simulation.simuler("Mil", "Kaolack", 10, 2012, climat_observe=observe)
    assert r["climat"]["source"] == "observe"
    assert r["climat"]["pluie_cumul_mm"] == 700.0

    r = simulation.simuler(
        "Mil", "Kaolack", 10, 2012, pluie_cumul_mm=300, climat_observe=observe
    )
    assert r["climat"]["source"] == "saisie_utilisateur"
    assert r["climat"]["pluie_cumul_mm"] == 300.0


def test_plus_de_pluie_plus_de_rendement(modele_entraine):
    sec = simulation.simuler("Mil", "Kaolack", 10, 2015, pluie_cumul_mm=250)
    humide = simulation.simuler("Mil", "Kaolack", 10, 2015, pluie_cumul_mm=850)
    assert humide["rendement_t_ha"] > sec["rendement_t_ha"]


def test_region_sans_station_utilise_la_voisine(modele_entraine):
    r = simulation.simuler("Mil", "Fatick", 10, 2027)
    assert r["climat"]["station_utilisee"] == "Kaolack"


@pytest.mark.parametrize(
    "parametres",
    [
        {"produit": "Mais"},
        {"region": "Paris"},
        {"saison": "Contre-saison"},
        {"superficie_ha": 0},
    ],
)
def test_saisie_invalide_refusee(modele_entraine, parametres):
    entree = {"produit": "Mil", "region": "Kaolack", "superficie_ha": 10, "annee": 2027}
    with pytest.raises(ValueError):
        simulation.simuler(**{**entree, **parametres})


def test_rendement_jamais_negatif(modele_entraine):
    r = simulation.simuler("Mil", "Kaolack", 10, 2027, pluie_cumul_mm=0)
    assert r["rendement_t_ha"] >= 0
