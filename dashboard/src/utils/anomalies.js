import {
  HISTORIQUE_MINIMUM,
  SEUIL_ANOMALIE_AGRICOLE,
  SEUIL_PLUIE_EXCES_MM,
  SEUIL_PLUIE_MM,
  SEUIL_TEMPERATURE,
} from "../config.js";
import {
  climatUnique,
  compterLignesRendement,
  rendement,
  somme,
} from "./calculs.js";

export const NIVEAUX_VULNERABILITE = {
  VULNERABLE: "Vulnérable",
  SURVEILLANCE: "Surveillance",
  NORMAL: "Normal",
  NON_EVALUABLE: "Non évaluable",
};

// Noms des 14 régions tirés des limites ADM1 servies par la carte.
export const REGIONS_SENEGAL = [
  "Dakar",
  "Diourbel",
  "Fatick",
  "Kaffrine",
  "Kaolack",
  "Kolda",
  "Louga",
  "Matam",
  "Saint Louis",
  "Sedhiou",
  "Tambacounda",
  "Thies",
  "Ziguinchor",
  "Kedougou",
];

function estNombre(valeur) {
  return typeof valeur === "number" && Number.isFinite(valeur);
}

function normaliserRegion(region) {
  return String(region ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s\u2010-\u2015]/g, "");
}

function nombresValides(valeurs) {
  return valeurs.filter(estNombre);
}

// Calcule la médiane des valeurs numériques connues.
export function mediane(valeurs) {
  const tries = nombresValides(valeurs).sort((a, b) => a - b);
  if (!tries.length) {
    return null;
  }

  const milieu = Math.floor(tries.length / 2);
  return tries.length % 2
    ? tries[milieu]
    : (tries[milieu - 1] + tries[milieu]) / 2;
}

// Calcule la déviation absolue médiane autour de la médiane.
export function mad(valeurs) {
  const valides = nombresValides(valeurs);
  const centre = mediane(valides);
  return centre === null
    ? null
    : mediane(valides.map((valeur) => Math.abs(valeur - centre)));
}

// Calcule le score z robuste ; une dispersion nulle donne un score neutre.
export function scoreRobuste(valeur, reference, dispersion) {
  if (!estNombre(valeur) || !estNombre(reference) || !estNombre(dispersion)) {
    return null;
  }
  return dispersion === 0
    ? 0
    : (0.6745 * (valeur - reference)) / dispersion;
}

// Applique le seuil z robuste, en gardant neutre le cas sans dispersion.
export function estSousSeuilAnomalie(
  valeur,
  reference,
  dispersion,
  seuil = SEUIL_ANOMALIE_AGRICOLE,
) {
  const score = scoreRobuste(valeur, reference, dispersion);
  return score !== null && score <= seuil;
}

// Compare chaque rendement annuel au même historique région-produit.
export function anomalieAgricole(lignes, options = {}) {
  const seuil = options.seuil ?? SEUIL_ANOMALIE_AGRICOLE;
  const historiqueMinimum = options.historiqueMinimum ?? HISTORIQUE_MINIMUM;
  const donnees = lignes.filter(
    (ligne) =>
      options.inclureDouteuses || ligne.indicateur_qualite !== 1,
  );
  const groupes = new Map();

  donnees.forEach((ligne) => {
    const cle = JSON.stringify([ligne.region, ligne.produit, ligne.annee]);
    if (!groupes.has(cle)) {
      groupes.set(cle, {
        region: ligne.region,
        produit: ligne.produit,
        annee: ligne.annee,
        lignes: [],
      });
    }
    groupes.get(cle).lignes.push(ligne);
  });

  const parProduit = new Map();
  groupes.forEach((groupe) => {
    const valeurRendement = rendement(groupe.lignes);
    const entree = {
      region: groupe.region,
      produit: groupe.produit,
      annee: groupe.annee,
      rendement: valeurRendement,
      superficie: somme(groupe.lignes, "superficie_ha"),
      lignesUtilisees: compterLignesRendement(groupe.lignes),
    };
    const cle = JSON.stringify([groupe.region, groupe.produit]);
    if (!parProduit.has(cle)) {
      parProduit.set(cle, []);
    }
    parProduit.get(cle).push(entree);
  });

  const resultats = [];
  parProduit.forEach((annees) => {
    const rendementsValides = annees
      .map((entree) => entree.rendement)
      .filter(estNombre);
    const reference = mediane(rendementsValides);
    const dispersion = mad(rendementsValides);
    const historiqueSuffisant =
      rendementsValides.length >= historiqueMinimum;

    annees.forEach((entree) => {
      const score =
        historiqueSuffisant && estNombre(entree.rendement)
          ? scoreRobuste(entree.rendement, reference, dispersion)
          : null;
      resultats.push({
        ...entree,
        mediane: reference,
        mad: dispersion,
        score,
        ecartPourcent:
          estNombre(entree.rendement) &&
          estNombre(reference) &&
          reference !== 0
            ? ((entree.rendement - reference) / Math.abs(reference)) * 100
            : null,
        anneesValides: rendementsValides.length,
        historiqueMinimum,
        historiqueSuffisant,
        anomalie: estSousSeuilAnomalie(
          entree.rendement,
          reference,
          dispersion,
          seuil,
        ),
      });
    });
  });

  return resultats.sort(
    (a, b) =>
      Number(a.annee) - Number(b.annee) ||
      String(a.region).localeCompare(String(b.region), "fr") ||
      String(a.produit).localeCompare(String(b.produit), "fr"),
  );
}

// Classe chaque région en combinant score agricole pondéré et climat annuel.
export function niveauRegion(lignes, annee, options = {}) {
  const seuilPluieExces =
    options.seuilPluieExcesMm === undefined
      ? SEUIL_PLUIE_EXCES_MM
      : options.seuilPluieExcesMm;
  const lignesQualite = lignes.filter(
    (ligne) =>
      options.inclureDouteuses || ligne.indicateur_qualite !== 1,
  );
  const lignesAgricoles = lignesQualite.filter(
    (ligne) =>
      (!options.produit || ligne.produit === options.produit) &&
      (!options.departement || ligne.departement === options.departement),
  );
  const lignesClimat = lignesQualite.filter(
    (ligne) =>
      !options.departement || ligne.departement === options.departement,
  );
  const resultatsAgricoles =
    options.resultatsAgricoles ??
    anomalieAgricole(lignesAgricoles, options);
  const agricoleParRegion = new Map();

  resultatsAgricoles
    .filter(
      (entree) =>
        String(entree.annee) === String(annee) &&
        estNombre(entree.score) &&
        estNombre(entree.superficie) &&
        entree.superficie > 0,
    )
    .forEach((entree) => {
      if (!agricoleParRegion.has(entree.region)) {
        agricoleParRegion.set(entree.region, []);
      }
      agricoleParRegion.get(entree.region).push(entree);
    });

  const climatParRegion = new Map();
  climatUnique(
    lignesClimat.filter((ligne) => String(ligne.annee) === String(annee)),
  ).forEach((ligne) => climatParRegion.set(ligne.region, ligne));

  const nomsRegionConnus = new Map();
  [...lignesAgricoles, ...lignesClimat].forEach((ligne) => {
    if (ligne.region !== null && ligne.region !== undefined) {
      nomsRegionConnus.set(normaliserRegion(ligne.region), ligne.region);
    }
  });
  const catalogueRegions = options.regions ?? REGIONS_SENEGAL;
  const regions = new Map(
    catalogueRegions.map((region) => [
      normaliserRegion(region),
      nomsRegionConnus.get(normaliserRegion(region)) ?? region,
    ]),
  );

  return [...regions.values()]
    .map((region) => {
      const scores = agricoleParRegion.get(region) ?? [];
      const superficieTotale = scores.reduce(
        (total, entree) => total + entree.superficie,
        0,
      );
      const scoreAgricole = superficieTotale
        ? scores.reduce(
            (total, entree) =>
              total + entree.score * entree.superficie,
            0,
          ) / superficieTotale
        : null;
      const ecartPourcent = superficieTotale
        ? scores.reduce(
            (total, entree) =>
              total +
              (estNombre(entree.ecartPourcent)
                ? entree.ecartPourcent * entree.superficie
                : 0),
            0,
          ) / superficieTotale
        : null;
      const climat = climatParRegion.get(region);
      const climatDisponible = Boolean(climat?.a_climat);
      const anomaliePluie =
        climatDisponible &&
        estNombre(climat.pluie_anomalie_mm) &&
        climat.pluie_anomalie_mm < SEUIL_PLUIE_MM;
      const anomaliePluieExces =
        climatDisponible &&
        seuilPluieExces !== null &&
        estNombre(climat.pluie_anomalie_mm) &&
        climat.pluie_anomalie_mm >= seuilPluieExces;
      const anomalieTemperature =
        climatDisponible &&
        estNombre(climat.tavg_anomalie) &&
        climat.tavg_anomalie >= SEUIL_TEMPERATURE;
      const anomalieClimatique =
        anomaliePluie || anomaliePluieExces || anomalieTemperature;
      const anomalieAgricoleRegion =
        estNombre(scoreAgricole) &&
        scoreAgricole <=
          (options.seuil ?? SEUIL_ANOMALIE_AGRICOLE);
      const historiqueInsuffisant = scoreAgricole === null;
      let niveau = NIVEAUX_VULNERABILITE.NON_EVALUABLE;

      if (!historiqueInsuffisant) {
        if (climatDisponible) {
          if (anomalieAgricoleRegion && anomalieClimatique) {
            niveau = NIVEAUX_VULNERABILITE.VULNERABLE;
          } else if (anomalieAgricoleRegion || anomalieClimatique) {
            niveau = NIVEAUX_VULNERABILITE.SURVEILLANCE;
          } else {
            niveau = NIVEAUX_VULNERABILITE.NORMAL;
          }
        } else {
          niveau = anomalieAgricoleRegion
            ? NIVEAUX_VULNERABILITE.SURVEILLANCE
            : NIVEAUX_VULNERABILITE.NORMAL;
        }
      }

      return {
        region,
        annee: Number(annee),
        niveau,
        niveauKpi:
          historiqueInsuffisant || !climatDisponible
            ? NIVEAUX_VULNERABILITE.NON_EVALUABLE
            : niveau,
        scoreAgricole,
        ecartPourcent,
        anomalieAgricole: anomalieAgricoleRegion,
        anomalieClimatique,
        anomaliePluie,
        anomaliePluieExces,
        anomalieTemperature,
        climatDisponible,
        mentionClimatIndisponible: !climatDisponible,
        historiqueInsuffisant,
        pluieAnomalie: climatDisponible ? climat.pluie_anomalie_mm : null,
        temperatureAnomalie: climatDisponible
          ? climat.tavg_anomalie
          : null,
        lignesUtilisees: scores.reduce(
          (total, entree) => total + entree.lignesUtilisees,
          0,
        ),
      };
    })
    .sort((a, b) => String(a.region).localeCompare(String(b.region), "fr"));
}
