"""Endpoints de prédiction (ml.service_prediction et Redis sont remplacés par des doublures)."""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

RACINE = Path(__file__).resolve().parents[2]
# Racine pour le paquet ml, api/ pour les imports à plat (`from routers...`),
# comme dans l'image Docker.
sys.path[:0] = [str(RACINE), str(RACINE / "api")]

from main import app

client = TestClient(app)
URL = "/api/v1/predictions"
ENTREE = {"produit": "Mil", "region": "Kaolack", "superficie_ha": 1000, "annee": 2015}
REPONSE = {
    "rendement_t_ha": 0.7,
    "production_t": 700.0,
    "climat": {
        "source": "observe",
        "pluie_cumul_mm": 500.0,
        "tavg_moyenne": 29.0,
        "pluie_normale_mm": 500.0,
        "station_utilisee": "Kaolack",
    },
    "reperes": {
        "rendement_moyen_historique_t_ha": 0.74,
        "erreur_moyenne_test_t_ha": 0.16,
    },
    "modele_version": "test",
    "avertissements": [],
}


@pytest.fixture(autouse=True)
def sans_redis():
    """Cache vide ; set_cached est observable."""
    with patch("routers.predictions.get_cached", return_value=None), patch(
        "routers.predictions.set_cached"
    ) as set_cached:
        yield set_cached


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_options():
    valeurs = {
        "produit": ["Mil"],
        "region": ["Kaolack"],
        "saison": ["Principale"],
        "systeme_production": ["Pluvial"],
    }
    with patch("ml.service_prediction.options", return_value=valeurs):
        assert client.get(f"{URL}/options").json() == valeurs


def test_options_sans_modele_renvoie_503():
    with patch("ml.service_prediction.options", side_effect=FileNotFoundError):
        assert client.get(f"{URL}/options").status_code == 503


def test_rendement_appelle_le_service_et_met_en_cache(sans_redis):
    with patch("ml.service_prediction.predire", return_value=REPONSE) as predire:
        r = client.post(f"{URL}/rendement", json=ENTREE)
    assert r.status_code == 200
    assert r.json() == REPONSE
    kwargs = predire.call_args.kwargs
    assert kwargs["produit"] == "Mil" and kwargs["saison"] == "Principale"
    assert callable(kwargs["ouvrir_connexion"])
    sans_redis.assert_called_once()


def test_reponse_en_cache_ne_rappelle_pas_le_modele():
    with patch("routers.predictions.get_cached", return_value=REPONSE), patch(
        "ml.service_prediction.predire"
    ) as predire:
        assert client.post(f"{URL}/rendement", json=ENTREE).json() == REPONSE
    predire.assert_not_called()


def test_climat_indisponible_pas_mis_en_cache(sans_redis):
    reponse = {**REPONSE, "avertissements": ["Climat observé indisponible (...)"]}
    with patch("ml.service_prediction.predire", return_value=reponse):
        assert client.post(f"{URL}/rendement", json=ENTREE).status_code == 200
    sans_redis.assert_not_called()


def test_valeur_inconnue_renvoie_422():
    with patch(
        "ml.service_prediction.predire", side_effect=ValueError("produit inconnu")
    ):
        r = client.post(f"{URL}/rendement", json={**ENTREE, "produit": "Mais"})
    assert r.status_code == 422
    assert "produit inconnu" in r.json()["detail"]


def test_modele_absent_renvoie_503():
    with patch("ml.service_prediction.predire", side_effect=FileNotFoundError):
        assert client.post(f"{URL}/rendement", json=ENTREE).status_code == 503


@pytest.mark.parametrize("champ, valeur", [("superficie_ha", 0), ("annee", 1900)])
def test_valeurs_numeriques_controlees(champ, valeur):
    with patch("ml.service_prediction.predire") as predire:
        r = client.post(f"{URL}/rendement", json={**ENTREE, champ: valeur})
    assert r.status_code == 422
    predire.assert_not_called()
