"""Routes d'agrégats du Dashboard (Snowflake et Redis sont remplacés par des doublures)."""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

RACINE = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(RACINE), str(RACINE / "api")]

from main import app

client = TestClient(app)


def snowflake(rows):
    """Connexion factice : retourne `rows` et garde la trace des requêtes."""
    cursor = MagicMock()
    cursor.fetchall.return_value = rows
    connection = MagicMock()
    connection.cursor.return_value = cursor
    return connection, cursor


@pytest.fixture(autouse=True)
def sans_redis():
    with patch("routers.agroclimat.get_cached", return_value=None), patch(
        "routers.agroclimat.set_cached"
    ), patch("routers.climat.get_cached", return_value=None), patch(
        "routers.climat.set_cached"
    ):
        yield


def test_agregats_par_annee_et_filtres():
    connection, cursor = snowflake(
        [
            (2019, 3, 500.0, 500.0, 1, 1.0, 0, 1),
            (2020, 4, 1030.0, 250.0, 2, 5.0, 3, 4),
        ]
    )
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        r = client.get(
            "/api/v1/agroclimat/agregats",
            params={"group_by": "annee", "region": "Kaolack", "produit": "Mil"},
        )

    assert r.status_code == 200
    body = r.json()
    assert body["group_by"] == "annee"
    assert body["data"][1] == {
        "cle": 2020,
        "nb_campagnes": 4,
        "production_t": 1030.0,
        "superficie_ha": 250.0,
        "nb_campagnes_rendement": 2,
        "rendement_t_ha": 5.0,
        "nb_avec_climat": 3,
        "nb_climat_renseigne": 4,
        "couverture_climat_pct": 75.0,
    }

    sql, params = cursor.execute.call_args.args
    assert "GROUP BY a.ANNEE" in sql
    assert "a.ANNEE IS NOT NULL" in sql
    # Rendement = ratio de sommes sur les campagnes complètes.
    assert "/ NULLIF(SUM(IFF(" in sql
    assert params == ["Kaolack", "Mil"]


def test_agregats_null_reste_null_et_total_vide_ignore():
    connection, _ = snowflake([(None, 0, None, None, 0, None, 0, 0)])
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        r = client.get("/api/v1/agroclimat/agregats", params={"group_by": "total"})
    assert r.json()["data"] == []

    connection, _ = snowflake([(None, 2, None, 10.0, 0, None, 0, 0)])
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        item = client.get("/api/v1/agroclimat/agregats", params={"group_by": "total"}).json()["data"][0]
    assert item["production_t"] is None
    assert item["rendement_t_ha"] is None
    assert item["couverture_climat_pct"] is None


def test_agregats_group_by_inconnu_refuse():
    r = client.get("/api/v1/agroclimat/agregats", params={"group_by": "1; DROP TABLE x"})
    assert r.status_code == 422


def test_agroclimat_carte_retourne_agregats_par_region_annee():
    connection, cursor = snowflake(
        [("Kaolack", 2020, 3, 500.0, 250.0, 2, 2.0, 2, 3)]
    )
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        r = client.get(
            "/api/v1/agroclimat/carte",
            params={"produit": "Mil", "systeme_production": "Pluvial"},
        )

    assert r.status_code == 200
    assert r.json()["data"][0] == {
        "region": "Kaolack",
        "annee": 2020,
        "nb_campagnes": 3,
        "production_t": 500.0,
        "superficie_ha": 250.0,
        "nb_campagnes_rendement": 2,
        "rendement_t_ha": 2.0,
        "nb_avec_climat": 2,
        "nb_climat_renseigne": 3,
    }
    sql, params = cursor.execute.call_args.args
    assert "GROUP BY z.REGION, a.ANNEE" in sql
    assert params == ["Mil", "Pluvial"]


def test_agroclimat_options_carte_sont_uniques():
    connection, _ = snowflake([("Mil", "Pluvial"), ("Riz", "Irrigué"), ("Mil", "Pluvial")])
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        r = client.get("/api/v1/agroclimat/options-carte")

    assert r.status_code == 200
    assert r.json() == {
        "produits": ["Mil", "Riz"],
        "systemes": ["Irrigué", "Pluvial"],
    }


def test_nuage_points_et_total():
    connection, cursor = snowflake(
        [(500.0, 1.2, "Mil", "Kaolack", 2020, 2), (650.0, 0.9, "Arachide", None, 2021, 2)]
    )
    with patch("routers.agroclimat.get_snowflake_connection", return_value=connection):
        r = client.get("/api/v1/agroclimat/nuage", params={"limite": 10, "annee": 2020})

    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 2
    assert body["data"][0] == {
        "pluie_cumul_mm": 500.0,
        "rendement_t_ha": 1.2,
        "produit": "Mil",
        "region": "Kaolack",
        "annee": 2020,
    }
    sql, params = cursor.execute.call_args.args
    assert "a.A_CLIMAT = TRUE" in sql
    assert params == [2020, 10]


def test_climat_annuel():
    connection, cursor = snowflake([(2020, 612.5, 8, 28.4, 9), (2021, None, 0, 28.9, 9)])
    with patch("routers.climat.get_snowflake_connection", return_value=connection):
        r = client.get("/api/v1/climat/annuel", params={"region": "Thiès"})

    assert r.status_code == 200
    assert r.json()["data"][1] == {
        "annee": 2021,
        "pluie_cumul_mm": None,
        "nb_stations_pluie": 0,
        "tavg_moyenne": 28.9,
        "nb_stations_temperature": 9,
    }
    sql, params = cursor.execute.call_args.args
    assert "NB_MOIS_PLUIE = 12" in sql
    assert params == ["Thiès"]


def test_climat_annuel_par_region():
    connection, cursor = snowflake(
        [("Kaolack", 2020, 612.5, 8, 28.4, 9)]
    )
    with patch("routers.climat.get_snowflake_connection", return_value=connection):
        r = client.get("/api/v1/climat/annuel/regions")

    assert r.status_code == 200
    assert r.json()["data"][0] == {
        "region": "Kaolack",
        "annee": 2020,
        "pluie_cumul_mm": 612.5,
        "nb_stations_pluie": 8,
        "tavg_moyenne": 28.4,
        "nb_stations_temperature": 9,
    }
    sql, params = cursor.execute.call_args.args
    assert "GROUP BY REGION, ANNEE" in sql
    assert params == []


def test_erreur_snowflake_renvoie_500():
    with patch("routers.agroclimat.get_snowflake_connection", side_effect=RuntimeError("boom")):
        assert client.get("/api/v1/agroclimat/agregats").status_code == 500
