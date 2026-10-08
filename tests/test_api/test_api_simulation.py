"""Endpoints de simulation (la logique ML est remplacée par des doublures)."""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from api.main import app

client = TestClient(app)
URL = "/api/v1/predictions/simulation"
ENTREE = {"produit": "Mil", "region": "Kaolack", "superficie_ha": 1000, "annee": 2027}
REPONSE = {
    "rendement_t_ha": 0.7,
    "production_t": 700.0,
    "climat": {
        "source": "normale_region",
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
}


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_options():
    valeurs = {
        "produit": ["Mil"],
        "region": ["Kaolack"],
        "saison": ["Principale"],
        "systeme_production": ["Pluvial"],
    }
    with patch("ml.scripts.simulation.valeurs_acceptees", return_value=valeurs):
        assert client.get(f"{URL}/options").json() == valeurs


def test_simulation_cherche_le_climat_observe_sans_pluie_saisie():
    with patch(
        "ml.scripts.simulation.lire_climat_observe", return_value=None
    ) as lire, patch("ml.scripts.simulation.simuler", return_value=REPONSE) as simuler:
        r = client.post(URL, json=ENTREE)
    assert r.status_code == 200
    lire.assert_called_once_with("Kaolack", 2027, "Principale")
    assert simuler.call_args.kwargs["climat_observe"] is None


def test_pluie_saisie_ne_consulte_pas_snowflake():
    with patch("ml.scripts.simulation.lire_climat_observe") as lire, patch(
        "ml.scripts.simulation.simuler", return_value=REPONSE
    ):
        client.post(URL, json={**ENTREE, "pluie_cumul_mm": 400})
    lire.assert_not_called()


def test_snowflake_indisponible_ne_bloque_pas():
    with patch(
        "ml.scripts.simulation.lire_climat_observe", side_effect=RuntimeError
    ), patch("ml.scripts.simulation.simuler", return_value=REPONSE):
        assert client.post(URL, json=ENTREE).status_code == 200


def test_valeur_inconnue_renvoie_422():
    with patch("ml.scripts.simulation.lire_climat_observe", return_value=None), patch(
        "ml.scripts.simulation.simuler", side_effect=ValueError("produit inconnu")
    ):
        r = client.post(URL, json={**ENTREE, "produit": "Mais"})
    assert r.status_code == 422
    assert "produit inconnu" in r.json()["detail"]


@pytest.mark.parametrize(
    "champ, valeur", [("superficie_ha", 0), ("pluie_cumul_mm", -5)]
)
def test_valeurs_numeriques_controlees(champ, valeur):
    assert client.post(URL, json={**ENTREE, champ: valeur}).status_code == 422
