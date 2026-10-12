import { useState } from "react";
import { NIVEAUX_VULNERABILITE } from "../utils/anomalies.js";

const GRAVITE = {
  [NIVEAUX_VULNERABILITE.VULNERABLE]: 0,
  [NIVEAUX_VULNERABILITE.SURVEILLANCE]: 1,
  [NIVEAUX_VULNERABILITE.NON_EVALUABLE]: 2,
  [NIVEAUX_VULNERABILITE.NORMAL]: 3,
};

const COLONNES = [
  ["region", "Région"],
  ["scoreAgricole", "Score"],
  ["ecartPourcent", "Écart de rendement (%)"],
  ["pluieAnomalie", "Anomalie de pluie (mm)"],
  ["temperatureAnomalie", "Anomalie de température (°C)"],
  ["niveau", "Niveau"],
];

function formater(valeur, champ) {
  if (typeof valeur !== "number" || !Number.isFinite(valeur)) {
    return "–";
  }

  const decimales = {
    scoreAgricole: 2,
    ecartPourcent: 1,
    pluieAnomalie: 0,
    temperatureAnomalie: 1,
  }[champ] ?? 0;
  return typeof valeur === "number" && Number.isFinite(valeur)
    ? valeur.toLocaleString("fr-FR", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      })
    : "–";
}

function classerNiveau(niveau) {
  return niveau.toLowerCase().replaceAll(" ", "-").replace("é", "e");
}

// Affiche les régions triables et rend chaque ligne activable au clic.
export default function TableauZonesASurveiller({
  lignes,
  onFiltreRegion,
  regionSelectionnee,
}) {
  const [champTri, setChampTri] = useState("niveau");
  const [sensTri, setSensTri] = useState(1);

  function changerTri(champ) {
    if (champTri === champ) {
      setSensTri((sens) => sens * -1);
    } else {
      setChampTri(champ);
      setSensTri(champ === "region" ? 1 : -1);
    }
  }

  return (
    <div className="tableau-zones-conteneur">
      <table className="tableau-zones">
        <caption>Zones à surveiller</caption>
        <thead>
          <tr>
            {COLONNES.map(([champ, titre]) => (
              <th scope="col" key={champ}>
                <button
                  type="button"
                  aria-label={`Trier par ${titre}`}
                  title={
                    champ === "ecartPourcent"
                      ? "Le niveau de risque est décidé à partir du score z robuste, pas du pourcentage d'écart."
                      : undefined
                  }
                  aria-sort={
                    champTri === champ
                      ? sensTri === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  onClick={() => changerTri(champ)}
                >
                  {titre}
                  {champTri === champ ? (sensTri === 1 ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...lignes].sort((a, b) => {
            if (champTri === "niveau") {
              return (
                (GRAVITE[a.niveau] - GRAVITE[b.niveau]) * sensTri
              );
            }
            const propriete =
              champTri === "scoreAgricole" ? "scoreAgricole" : champTri;
            const valeurA = a[propriete];
            const valeurB = b[propriete];
            const comparaison =
              typeof valeurA === "number" && typeof valeurB === "number"
                ? valeurA - valeurB
                : String(valeurA ?? "").localeCompare(
                    String(valeurB ?? ""),
                    "fr",
                  );
            return comparaison * sensTri;
          }).map((ligne) => (
            <tr
              key={ligne.region}
              className={
                regionSelectionnee === ligne.region ? "ligne-selectionnee" : ""
              }
              onClick={() => onFiltreRegion(ligne.region)}
            >
              <th scope="row">
                <button
                  className="lien-region"
                  type="button"
                  aria-label={`Filtrer la région ${ligne.region}`}
                  onClick={(evenement) => {
                    evenement.stopPropagation();
                    onFiltreRegion(ligne.region);
                  }}
                >
                  {ligne.region}
                </button>
              </th>
              <td>{formater(ligne.scoreAgricole, "scoreAgricole")}</td>
              <td>
                {Number.isFinite(ligne.ecartPourcent)
                  ? `${formater(
                      ligne.ecartPourcent,
                      "ecartPourcent",
                    )}%`
                  : "–"}
              </td>
              <td>{formater(ligne.pluieAnomalie, "pluieAnomalie")}</td>
              <td>
                {formater(
                  ligne.temperatureAnomalie,
                  "temperatureAnomalie",
                )}
              </td>
              <td>
                <span
                  className={`pastille-niveau niveau-${classerNiveau(
                    ligne.niveau,
                  )}`}
                >
                  {ligne.niveau}
                  {ligne.historiqueInsuffisant
                    ? " · historique insuffisant"
                    : ""}
                  {ligne.mentionClimatIndisponible
                    ? " · climat indisponible"
                    : ""}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
