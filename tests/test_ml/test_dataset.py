"""Préparation du dataset d'entraînement (ml/scripts/donnees.py)."""

import pytest

from ml.scripts.donnees import baseline, normales, preparer


def test_region_sans_station_prend_le_climat_de_la_voisine(dataset):
    df = preparer(dataset)
    fatick = df[(df.region == "Fatick") & (df.annee == 2000)].iloc[0]
    kaolack = df[(df.region == "Kaolack") & (df.annee == 2000)].iloc[0]
    assert fatick.pluie_cumul_mm == kaolack.pluie_cumul_mm
    assert fatick.source_climat == "region_voisine"
    assert kaolack.source_climat == "mesure"


def test_campagnes_sans_pluie_ecartees(dataset):
    dataset.loc[dataset.region == "Kaolack", "a_climat"] = False
    df = preparer(dataset)
    # Kaolack n'a plus de climat : Kaolack, Kaffrine et Fatick sont écartées.
    assert not df.region.isin(["Kaolack", "Kaffrine", "Fatick"]).any()
    assert df.pluie_cumul_mm.notna().all()


def test_systeme_production_vide_devient_pluvial(dataset):
    df = preparer(dataset)
    assert dataset.systeme_production.isna().any()
    assert (df.systeme_production == "Pluvial").all()


def test_normales_une_valeur_par_region_et_saison(dataset):
    n = normales(preparer(dataset))
    assert n.index.is_unique
    assert ("Fatick", "Principale") in n.index


def test_baseline_moyenne_region_produit_de_train(dataset):
    df = preparer(dataset)
    train, test = df[df.jeu == "train"], df[df.jeu == "test"]
    pred = baseline(train, test)
    attendu = train[
        (train.region == test.iloc[0].region) & (train.produit == test.iloc[0].produit)
    ]
    assert pred[0] == pytest.approx(attendu.cible_rendement_t_ha.mean())
