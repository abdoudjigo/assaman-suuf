import assert from "node:assert/strict";
import test from "node:test";
import {
  anomalieAgricole,
  estSousSeuilAnomalie,
  mad,
  mediane,
  niveauRegion,
  NIVEAUX_VULNERABILITE,
  REGIONS_SENEGAL,
  scoreRobuste,
} from "./anomalies.js";

test("calcule une médiane paire et ignore les valeurs absentes", () => {
  assert.equal(mediane([null, 1, 3, 2, undefined]), 2);
  assert.equal(mediane([null, undefined]), null);
});

test("calcule le MAD à partir de la médiane", () => {
  assert.equal(mad([1, 2, 3, 4, 100]), 1);
  assert.equal(mad([null, null]), null);
});

test("un MAD nul donne un score robuste neutre", () => {
  assert.equal(scoreRobuste(5, 5, 0), 0);
  assert.equal(scoreRobuste(null, 5, 0), null);
});

test("un rendement sous la limite basse du seuil agricole est une anomalie", () => {
  const medianeHistorique = 10;
  const dispersion = 1;
  const limiteBasse =
    medianeHistorique + (-1.5 * dispersion) / 0.6745;

  assert.ok(estSousSeuilAnomalie(limiteBasse - 0.01, medianeHistorique, dispersion));
  assert.ok(
    !estSousSeuilAnomalie(limiteBasse + 0.01, medianeHistorique, dispersion),
  );
});

test("refuse un score avant le nombre minimum d'années valides", () => {
  const lignes = Array.from({ length: 7 }, (_, index) => ({
    region: "Kolda",
    produit: "Mil",
    annee: 2000 + index,
    production_t: 10,
    superficie_ha: 10,
  }));

  const resultats = anomalieAgricole(lignes);
  assert.equal(resultats.length, 7);
  assert.ok(resultats.every((entree) => entree.score === null));
  assert.ok(resultats.every((entree) => !entree.historiqueSuffisant));
});

test("ignore les nulls, agrège les rendements et exclut la qualité douteuse", () => {
  const lignes = Array.from({ length: 8 }, (_, index) => ({
    region: "Kaolack",
    produit: "Mil",
    annee: 2000 + index,
    production_t: 10,
    superficie_ha: 10,
    indicateur_qualite: 0,
  }));
  lignes.push(
    {
      region: "Kaolack",
      produit: "Mil",
      annee: 2000,
      production_t: null,
      superficie_ha: 100,
      indicateur_qualite: 0,
    },
    {
      region: "Kaolack",
      produit: "Mil",
      annee: 2001,
      production_t: 0,
      superficie_ha: 1,
      indicateur_qualite: 1,
    },
  );

  const resultats = anomalieAgricole(lignes);
  assert.equal(resultats.length, 8);
  assert.equal(resultats[0].rendement, 1);
  assert.equal(resultats[0].superficie, 110);
  assert.ok(resultats.every((entree) => entree.score === 0));
});

test("indique un climat indisponible et classe selon l'anomalie agricole seule", () => {
  const annee = 2020;
  const lignes = Array.from({ length: 8 }, (_, index) => ({
    region: "Tambacounda",
    produit: "Mil",
    annee: 2012 + index,
    production_t: 10,
    superficie_ha: 10,
    a_climat: false,
  }));
  lignes.push({
    region: "Tambacounda",
    produit: "Mil",
    annee,
    production_t: 10,
    superficie_ha: 10,
    a_climat: false,
  });

  const resultats = anomalieAgricole(lignes);
  const niveau = niveauRegion(lignes, annee, {
    resultatsAgricoles: resultats,
  }).find((entree) => entree.region === "Tambacounda");
  assert.equal(niveau.niveau, NIVEAUX_VULNERABILITE.NORMAL);
  assert.equal(niveau.climatDisponible, false);
  assert.equal(niveau.mentionClimatIndisponible, true);
  assert.equal(
    niveau.niveauKpi,
    NIVEAUX_VULNERABILITE.NON_EVALUABLE,
  );
});

test("classe vulnérable une anomalie agricole et climatique sans surpondérer le climat", () => {
  const rendements = [0.8, 0.9, 1, 1, 1, 1.1, 1.2, 1.3, 0];
  const lignes = rendements.map((valeur, index) => ({
    region: "Kolda",
    produit: "Mil",
    annee: 2010 + index,
    production_t: valeur * 10,
    superficie_ha: 10,
    a_climat: true,
    pluie_anomalie_mm: index === 8 ? -150 : 0,
  }));
  lignes.push({
    ...lignes[8],
    produit: "Maïs",
    production_t: 10,
  });

  const resultats = anomalieAgricole(lignes);
  const niveau = niveauRegion(lignes, 2018, {
    resultatsAgricoles: resultats,
  }).find((entree) => entree.region === "Kolda");
  assert.equal(niveau.niveau, NIVEAUX_VULNERABILITE.VULNERABLE);
  assert.equal(niveau.anomalieClimatique, true);
  assert.equal(niveau.lignesUtilisees, 1);
});

test("retourne toujours les 14 régions du référentiel", () => {
  const niveaux = niveauRegion([], 2020);
  assert.equal(REGIONS_SENEGAL.length, 14);
  assert.equal(niveaux.length, 14);
  assert.ok(
    niveaux.every(
      (entree) =>
        entree.niveauKpi === NIVEAUX_VULNERABILITE.NON_EVALUABLE,
    ),
  );
});

test("une pluie excédentaire n'est active qu'avec un seuil explicite", () => {
  const lignes = Array.from({ length: 9 }, (_, index) => ({
    region: "Kolda",
    produit: "Mil",
    annee: 2010 + index,
    production_t: 10,
    superficie_ha: 10,
    indicateur_qualite: 0,
    a_climat: true,
    pluie_anomalie_mm: index === 8 ? 300 : 0,
    tavg_anomalie: 0,
  }));
  const resultatsAgricoles = anomalieAgricole(lignes);
  const sansSeuil = niveauRegion(lignes, 2018, {
    resultatsAgricoles,
  }).find((entree) => entree.region === "Kolda");
  const avecSeuil = niveauRegion(lignes, 2018, {
    resultatsAgricoles,
    seuilPluieExcesMm: 300,
  }).find((entree) => entree.region === "Kolda");

  assert.equal(sansSeuil.anomaliePluieExces, false);
  assert.equal(sansSeuil.niveau, NIVEAUX_VULNERABILITE.NORMAL);
  assert.equal(avecSeuil.anomaliePluieExces, true);
  assert.equal(avecSeuil.niveau, NIVEAUX_VULNERABILITE.SURVEILLANCE);
});
