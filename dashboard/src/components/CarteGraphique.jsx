import { useEffect, useState } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { appliquerPaletteTheme } from "../utils/couleursTheme.js";

// Enregistre les éléments Chart.js utilisés par les graphiques des deux vues.
ChartJS.register(
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
);

// Fournit les couleurs CSS courantes afin que les axes suivent le thème système.
function lireCouleursTheme() {
  const styles = getComputedStyle(document.documentElement);
  return {
    texte: styles.getPropertyValue("--texte").trim(),
    discret: styles.getPropertyValue("--discret").trim(),
    bordure: styles.getPropertyValue("--bordure").trim(),
  };
}

// Formate une valeur numérique avec les séparateurs et décimales françaises.
function formaterValeur(valeur) {
  return typeof valeur === "number" && Number.isFinite(valeur)
    ? valeur.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
    : "–";
}

// Produit un fichier CSV compatible avec les tableurs configurés en français.
function exporterCsv(titre, donnees) {
  const colonnes = [
    "Graphique",
    "Série",
    "Période ou catégorie",
    "Valeur X",
    "Valeur Y",
    "Unité",
    "Lignes utilisées",
  ];
  const echapper = (valeur) => {
    const texte = valeur === null || valeur === undefined ? "" : String(valeur);
    return /[;"\r\n]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
  };
  const lignes = [colonnes.map(echapper).join(";")];

  donnees.datasets.forEach((jeu) => {
    jeu.data.forEach((valeur, index) => {
      const scatter = valeur !== null && typeof valeur === "object";
      lignes.push(
        [
          titre,
          jeu.label,
          scatter ? valeur.annee : donnees.labels?.[index],
          scatter ? formaterValeur(valeur.x) : "",
          formaterValeur(scatter ? valeur.y : valeur),
          scatter ? `${jeu.uniteX ?? ""} / ${jeu.uniteY ?? ""}` : jeu.unite,
          scatter
            ? valeur.lignesUtilisees
            : (jeu.lineCounts?.[index] ?? 0),
        ]
          .map(echapper)
          .join(";"),
      );
    });
  });

  const contenu = `\uFEFF${lignes.join("\r\n")}`;
  const fichier = new Blob([contenu], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  const nomFichier = titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  lien.href = url;
  lien.download = `${nomFichier || "donnees"}.csv`;
  document.body.append(lien);
  lien.click();
  window.setTimeout(() => {
    lien.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

// Encapsule un graphique dans une carte accessible au clavier et aux lecteurs d'écran.
export default function CarteGraphique({
  titre,
  type = "bar",
  donnees,
  options,
  ariaLabel,
  note,
  onClicElement,
  sansDonnees = false,
}) {
  const [revisionTheme, setRevisionTheme] = useState(0);
  const [selectionCroisee, setSelectionCroisee] = useState("");
  const couleursTheme = lireCouleursTheme();
  const reduireMouvements = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const peutFiltrer = Boolean(
    onClicElement && donnees.labels?.length && donnees.datasets?.length,
  );

  function filtrerElement(index, datasetIndex) {
    const label = donnees.labels?.[index];
    const dataset = donnees.datasets?.[datasetIndex];

    if (label !== undefined && dataset) {
      onClicElement?.({
        label,
        dataset,
        valeur: dataset.data[index],
        index,
        datasetIndex,
      });
    }
  }

  useEffect(() => {
    const mouvement = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualiserAffichage = () =>
      setRevisionTheme((revision) => revision + 1);

    window.addEventListener("themechange", actualiserAffichage);
    mouvement.addEventListener("change", actualiserAffichage);
    return () => {
      window.removeEventListener("themechange", actualiserAffichage);
      mouvement.removeEventListener("change", actualiserAffichage);
    };
  }, []);

  const optionsThematisees = {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: reduireMouvements ? 0 : 300 },
    color: couleursTheme.texte,
    plugins: {
      ...options?.plugins,
      legend: {
        ...options?.plugins?.legend,
        labels: {
          color: couleursTheme.texte,
          ...options?.plugins?.legend?.labels,
        },
      },
      tooltip: {
        ...options?.plugins?.tooltip,
        callbacks: {
          ...options?.plugins?.tooltip?.callbacks,
          title: (elements) => {
            const premier = elements[0];
            const annee = premier?.raw?.annee;
            return annee
              ? `${premier.dataset.label} (${annee})`
              : premier?.label ?? "";
          },
          label: (contexte) => {
            const valeur = contexte.raw;
            const lignesUtilisees =
              valeur?.lignesUtilisees ??
              contexte.dataset.lineCounts?.[contexte.dataIndex] ??
              0;

            if (valeur !== null && typeof valeur === "object") {
              return `${formaterValeur(valeur.x)} ${contexte.dataset.uniteX} · ${formaterValeur(valeur.y)} ${contexte.dataset.uniteY} · ${lignesUtilisees} lignes utilisées`;
            }

            return `${contexte.dataset.label} : ${formaterValeur(valeur)} ${contexte.dataset.unite ?? ""} · ${lignesUtilisees} lignes utilisées`;
          },
        },
      },
    },
    scales: Object.fromEntries(
      Object.entries(options?.scales ?? {}).map(([nom, echelle]) => [
        nom,
        {
          ...echelle,
          ticks: { color: couleursTheme.discret, ...echelle.ticks },
          grid: { color: couleursTheme.bordure, ...echelle.grid },
          title: {
            color: couleursTheme.discret,
            ...echelle.title,
          },
        },
      ]),
    ),
    onClick: (evenement, elements, graphique) => {
      options?.onClick?.(evenement, elements, graphique);

      if (peutFiltrer && elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        filtrerElement(index, datasetIndex);
      }
    },
  };
  const donneesThematisees = {
    ...donnees,
    datasets: donnees.datasets.map((jeu) => ({
      ...jeu,
      ...Object.fromEntries(
        [
          "backgroundColor",
          "borderColor",
          "pointBackgroundColor",
          "pointBorderColor",
          "hoverBackgroundColor",
          "hoverBorderColor",
        ]
          .filter((cle) => jeu[cle] !== undefined)
          .map((cle) => [cle, appliquerPaletteTheme(jeu[cle])]),
      ),
    })),
  };

  return (
    <article className="carte-graphique" data-theme-revision={revisionTheme}>
      <div className="entete-carte-graphique">
        <h3>{titre}</h3>
        {!sansDonnees && (
          <button
            className="bouton-export"
            type="button"
            onClick={() => exporterCsv(titre, donnees)}
            aria-label={`Exporter les données de ${titre} au format CSV`}
          >
            Exporter CSV
          </button>
        )}
      </div>
      {!sansDonnees && note && <p className="note-graphique">{note}</p>}
      {sansDonnees ? (
        <div className="cadre-sans-climat" role="status">
          Pas de données climatiques pour cette sélection
        </div>
      ) : (
        <div
          className={`zone-graphique${peutFiltrer ? " cliquable" : ""}`}
          role="img"
          aria-label={ariaLabel}
        >
          <Chart
            type={type}
            data={donneesThematisees}
            options={optionsThematisees}
            aria-hidden="true"
          />
        </div>
      )}
      {!sansDonnees && peutFiltrer && (
        <details className="controle-filtre-graphique">
          <summary>Filtrer à partir des données du graphique</summary>
          <label>
            Valeur à sélectionner
            <select
              aria-label={`Valeur à sélectionner dans ${titre}`}
              value={selectionCroisee}
              onChange={(evenement) => {
                const index = Number(evenement.target.value);
                setSelectionCroisee("");
                filtrerElement(index, 0);
              }}
            >
              <option value="">Choisir une valeur…</option>
              {donnees.labels.map((label, index) => (
                <option key={`${label}-${index}`} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </details>
      )}
    </article>
  );
}
