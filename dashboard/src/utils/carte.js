import {
  climatUnique,
  compterLignesRendement,
  compterValeurs,
  grouper,
  moyenne,
  rendement,
  somme,
} from "./calculs.js";

export const VARIABLES_CARTE = {
  rendement_t_ha: { libelle: "Rendement", unite: "t/ha", climat: false },
  production_t: { libelle: "Production", unite: "t", climat: false },
  pluie_anomalie_mm: {
    libelle: "Anomalie de pluie",
    unite: "mm",
    climat: true,
  },
  tavg_anomalie: {
    libelle: "Anomalie de température",
    unite: "°C",
    climat: true,
  },
  niveau_vulnerabilite: {
    libelle: "Niveau de vulnérabilité",
    unite: "",
    climat: false,
    categorique: true,
  },
};

const COULEUR_FAIBLE = [232, 245, 233];
const COULEUR_FORTE = [63, 163, 77];
const COULEUR_NEGATIVE = [224, 56, 43];
const COULEUR_NEUTRE = [255, 255, 255];
const COULEUR_POSITIVE = [28, 143, 208];

// Uniformise les noms des régions avant de comparer l'API et la carte.
export function normaliserNom(nom) {
  return String(nom ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-\s\u2010-\u2015]/g, "");
}

// Agrège les lignes régionales sans transformer les valeurs absentes en zéros.
export function calculerValeursCarte(
  lignes,
  variable,
  niveauxVulnerabilite = [],
) {
  const definition = VARIABLES_CARTE[variable];
  if (!definition) {
    throw new Error(`Variable cartographique inconnue : ${variable}`);
  }

  if (definition.categorique) {
    return new Map(
      niveauxVulnerabilite.map((entree) => [
        normaliserNom(entree.region),
        {
          region: entree.region,
          valeur: entree.niveau,
          lignesUtilisees: entree.lignesUtilisees,
          climatDisponible: entree.climatDisponible,
        },
      ]),
    );
  }

  const groupes = grouper(lignes, "region");
  const valeurs = new Map();

  Object.entries(groupes).forEach(([nomRegion, lignesRegion]) => {
    const lignesClimat = definition.climat ? climatUnique(lignesRegion) : [];
    const valeur =
      variable === "rendement_t_ha"
        ? rendement(lignesRegion)
        : variable === "production_t"
          ? somme(lignesRegion, "production_t")
          : moyenne(lignesClimat, variable);
    const lignesUtilisees =
      variable === "rendement_t_ha"
        ? compterLignesRendement(lignesRegion)
        : variable === "production_t"
          ? compterValeurs(lignesRegion, "production_t")
          : compterValeurs(lignesClimat, variable);

    valeurs.set(normaliserNom(nomRegion), {
      region: nomRegion,
      valeur,
      lignesUtilisees,
      climatDisponible: !definition.climat || lignesClimat.length > 0,
    });
  });

  return valeurs;
}

// Signale les écarts de noms entre les régions de l'API et celles du GeoJSON.
export function obtenirCorrespondances(regionsApi, geojson) {
  const nomsApi = new Map(regionsApi.map((nom) => [normaliserNom(nom), nom]));
  const nomsCarte = new Map(
    (geojson?.features ?? []).map((feature) => [
      normaliserNom(feature.properties?.shapeName),
      feature.properties?.shapeName,
    ]),
  );

  return {
    regionsApiSansCarte: [...nomsApi.entries()]
      .filter(([cle]) => !nomsCarte.has(cle))
      .map(([, nom]) => nom),
    regionsCarteSansApi: [...nomsCarte.entries()]
      .filter(([cle]) => !nomsApi.has(cle))
      .map(([, nom]) => nom),
  };
}

function melanger(couleurDepart, couleurArrivee, proportion) {
  const canaux = couleurDepart.map((canal, index) =>
    Math.round(canal + (couleurArrivee[index] - canal) * proportion),
  );
  return `#${canaux.map((canal) => canal.toString(16).padStart(2, "0")).join("")}`;
}

// Applique une palette verte ou une échelle divergente centrée sur zéro.
export function couleurSelonValeur(valeur, domaine, variable) {
  if (variable === "niveau_vulnerabilite") {
    return {
      Vulnérable: "#e0382b",
      Surveillance: "#f5a623",
      Normal: "#3fa34d",
      "Non évaluable": "#a8b3bd",
    }[valeur] ?? "#a8b3bd";
  }

  if (valeur === null || !Number.isFinite(valeur)) {
    return "#a8b3bd";
  }

  if (VARIABLES_CARTE[variable].climat) {
    const amplitude = Math.max(Math.abs(domaine.min), Math.abs(domaine.max));
    if (amplitude === 0) {
      return "#ffffff";
    }

    const anomalieChaleur = variable === "tavg_anomalie" ? -valeur : valeur;
    const proportion = Math.min(Math.abs(anomalieChaleur) / amplitude, 1);
    return anomalieChaleur < 0
      ? melanger(COULEUR_NEUTRE, COULEUR_NEGATIVE, proportion)
      : melanger(COULEUR_NEUTRE, COULEUR_POSITIVE, proportion);
  }

  const amplitude = domaine.max - domaine.min;
  const proportion = amplitude === 0 ? 1 : (valeur - domaine.min) / amplitude;
  return melanger(COULEUR_FAIBLE, COULEUR_FORTE, proportion);
}

// Prépare les couleurs et repères de la légende pour la variable active.
export function obtenirLegende(domaine, variable) {
  if (variable === "niveau_vulnerabilite") {
    return {
      gradient: "",
      reperes: [],
      plage: null,
      categories: [
        ["Vulnérable", "#e0382b"],
        ["Surveillance", "#f5a623"],
        ["Normal", "#3fa34d"],
        ["Non évaluable", "#a8b3bd"],
      ],
    };
  }
  if (!domaine) {
    return { gradient: "", reperes: [], plage: null };
  }

  if (VARIABLES_CARTE[variable].climat) {
    const amplitude = Math.max(Math.abs(domaine.min), Math.abs(domaine.max));
    const gradient =
      variable === "tavg_anomalie"
        ? "linear-gradient(90deg, #1c8fd0, #ffffff, #e0382b)"
        : "linear-gradient(90deg, #e0382b, #ffffff, #1c8fd0)";
    return {
      gradient,
      reperes: [-amplitude, 0, amplitude],
      plage: { min: -amplitude, max: amplitude },
    };
  }

  return {
    gradient: "linear-gradient(90deg, #e8f5e9, #3fa34d)",
    reperes: [domaine.min, domaine.max],
    plage: { min: domaine.min, max: domaine.max },
  };
}
