import { Chart as ChartJS, Filler } from "chart.js";
import CarteGraphique from "./CarteGraphique.jsx";
import { climatUnique } from "../utils/calculs.js";
import {
  HISTORIQUE_MINIMUM,
  SEUIL_ANOMALIE_AGRICOLE,
  SEUIL_PLUIE_EXCES_MM,
  SEUIL_PLUIE_MM,
  SEUIL_TEMPERATURE,
} from "../config.js";
import { estSousSeuilAnomalie } from "../utils/anomalies.js";

ChartJS.register(Filler);

// Compare le rendement annuel à sa médiane et marque les écarts climatiques.
export default function GraphiqueRendementNormale({
  lignes,
  resultats,
  region,
  produit,
  departement,
  inclureDouteuses,
}) {
  if (!region || !produit) {
    return (
      <article className="carte-graphique">
        <h3>Rendement et normale</h3>
        <p className="message-etat">
          Choisissez une région et un produit dans les filtres pour afficher
          leur historique.
        </p>
      </article>
    );
  }

  const serie = resultats
    .filter((entree) => entree.region === region && entree.produit === produit)
    .sort((a, b) => Number(a.annee) - Number(b.annee));
  const historiqueSuffisant =
    serie[0]?.historiqueSuffisant && serie.some((entree) => entree.score !== null);

  if (!historiqueSuffisant) {
    return (
      <article className="carte-graphique">
        <h3>Rendement et normale</h3>
        <p className="message-etat" role="status">
          Historique insuffisant pour {region} — {produit} : au moins{" "}
          {HISTORIQUE_MINIMUM} années de rendement valide sont nécessaires.
        </p>
      </article>
    );
  }

  const climatParAnnee = new Map(
    climatUnique(
      lignes.filter(
        (ligne) =>
          ligne.region === region &&
          (!departement || ligne.departement === departement) &&
          (inclureDouteuses || ligne.indicateur_qualite !== 1),
      ),
    ).map((ligne) => [String(ligne.annee), ligne]),
  );
  const centre = serie[0].mediane;
  const demiLargeur =
    (-SEUIL_ANOMALIE_AGRICOLE * serie[0].mad) / 0.6745;
  const limiteBasse = centre - demiLargeur;
  const limiteHaute = centre + demiLargeur;
  const couleursPoints = serie.map((entree) => {
    const climat = climatParAnnee.get(String(entree.annee));
    const anomalieClimatique =
      climat?.a_climat &&
      (((typeof climat.pluie_anomalie_mm === "number" &&
        climat.pluie_anomalie_mm < SEUIL_PLUIE_MM) ||
        (SEUIL_PLUIE_EXCES_MM !== null &&
          typeof climat.pluie_anomalie_mm === "number" &&
          climat.pluie_anomalie_mm >= SEUIL_PLUIE_EXCES_MM)) ||
        (typeof climat.tavg_anomalie === "number" &&
          climat.tavg_anomalie >= SEUIL_TEMPERATURE));
    const sousSeuil = estSousSeuilAnomalie(
      entree.rendement,
      entree.mediane,
      entree.mad,
    );
    return sousSeuil
      ? "#e0382b"
      : anomalieClimatique
        ? "#f5a623"
        : "#1c8fd0";
  });
  const nombresLignes = serie.map((entree) => entree.lignesUtilisees);
  const donnees = {
    labels: serie.map((entree) => String(entree.annee)),
    datasets: [
      {
        label: "Zone normale : au-dessus du seuil d'anomalie",
        data: serie.map(() => limiteHaute),
        borderColor: "transparent",
        backgroundColor: "rgba(63, 163, 77, 0.18)",
        pointRadius: 0,
        fill: false,
        lineCounts: serie.map(() => 0),
        unit: "t/ha",
      },
      {
        label: "Seuil inférieur d'anomalie agricole",
        data: serie.map(() => limiteBasse),
        borderColor: "transparent",
        backgroundColor: "rgba(63, 163, 77, 0.18)",
        pointRadius: 0,
        fill: "-1",
        lineCounts: serie.map(() => 0),
        unit: "t/ha",
      },
      {
        label: "Médiane historique",
        data: serie.map(() => centre),
        borderColor: "#3fa34d",
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        lineCounts: serie.map(() => 0),
        unit: "t/ha",
      },
      {
        label: "Rendement observé",
        data: serie.map((entree) => entree.rendement),
        borderColor: "#1c8fd0",
        backgroundColor: couleursPoints,
        pointBackgroundColor: couleursPoints,
        pointBorderColor: couleursPoints,
        pointRadius: 5,
        spanGaps: false,
        fill: false,
        lineCounts: nombresLignes,
        unit: "t/ha",
      },
    ],
  };

  return (
    <CarteGraphique
      titre="Rendement et normale"
      type="line"
      donnees={donnees}
      options={{
        scales: {
          x: { grid: { display: false }, title: { display: true, text: "Année" } },
          y: { title: { display: true, text: "Rendement (t/ha)" } },
        },
      }}
      ariaLabel={`Rendement et bande de normalité de ${produit} dans la région ${region}`}
      note="Zone normale : au-dessus du seuil d'anomalie. Points rouges : rendement sous le seuil agricole ; points orange : anomalie climatique."
    />
  );
}
