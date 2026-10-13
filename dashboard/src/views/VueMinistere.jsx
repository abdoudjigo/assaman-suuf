import { useMemo, useState } from "react";
import Alertes from "../components/Alertes.jsx";
import CarteGraphique from "../components/CarteGraphique.jsx";
import CarteKpi from "../components/CarteKpi.jsx";
import CarteSenegal from "../components/CarteSenegal.jsx";
import ModuleVulnerabilite from "../components/ModuleVulnerabilite.jsx";
import { COULEURS } from "../config.js";
import { chargerAnomalies } from "../services/sourceAnomalies.js";
import {
  compterLignesRendement,
  compterValeurs,
  climatUnique,
  correlation,
  grouper,
  moyenneClimat,
  rendement,
  somme,
} from "../utils/calculs.js";
import { niveauRegion } from "../utils/anomalies.js";

// Les libellés et unités sont partagés par les graphiques et leur sélection.
const VARIABLES_CLIMATIQUES = {
  pluie_cumul_mm: { libelle: "Pluie cumulée", unite: "mm" },
  tavg_moyenne: { libelle: "Température moyenne", unite: "°C" },
  pluie_anomalie_mm: { libelle: "Anomalie de pluie", unite: "mm" },
  tavg_anomalie: { libelle: "Anomalie de température", unite: "°C" },
};

// Construit les KPI et les quatre graphiques stratégiques ministériels.
export default function VueMinistere({
  donnees,
  filtres,
  lignes,
  lignesCarte,
  lignesGraphiques,
  onFiltreAnnee,
  onFiltreRegion,
}) {
  const [variable, setVariable] = useState("pluie_cumul_mm");
  const [inclureDouteuses, setInclureDouteuses] = useState(false);
  const variableSelectionnee = VARIABLES_CLIMATIQUES[variable];
  const sansClimat = climatUnique(lignesGraphiques).length === 0;
  const anneesDisponibles = donnees
    .map((ligne) => Number(ligne.annee))
    .filter(Number.isFinite);
  const anneesClimatiques = climatUnique(donnees)
    .map((ligne) => Number(ligne.annee))
    .filter(Number.isFinite);
  const anneeMin = anneesDisponibles.length
    ? Math.min(...anneesDisponibles)
    : null;
  const anneeMax = anneesDisponibles.length
    ? Math.max(...anneesDisponibles)
    : null;
  const anneeClimatMin = anneesClimatiques.length
    ? Math.min(...anneesClimatiques)
    : null;
  const anneeClimatMax = anneesClimatiques.length
    ? Math.max(...anneesClimatiques)
    : null;
  const anneeAnalyse = filtres.annee
    ? Number(filtres.annee)
    : anneesDisponibles.length
      ? Math.max(...anneesDisponibles)
      : null;
  const lignesHistorique = useMemo(
    () =>
      donnees.filter(
        (ligne) =>
          (!filtres.departement ||
            ligne.departement === filtres.departement) &&
          (!filtres.produit || ligne.produit === filtres.produit),
      ),
    [donnees, filtres.departement, filtres.produit],
  );
  const resultatsAgricoles = useMemo(
    () =>
      chargerAnomalies(lignesHistorique, {
        inclureDouteuses,
      }),
    [lignesHistorique, inclureDouteuses],
  );
  const niveauxVulnerabilite = useMemo(
    () =>
      anneeAnalyse === null
        ? []
        : niveauRegion(donnees, anneeAnalyse, {
            resultatsAgricoles,
            produit: filtres.produit,
            departement: filtres.departement,
            inclureDouteuses,
          }),
    [
      anneeAnalyse,
      donnees,
      filtres.departement,
      filtres.produit,
      inclureDouteuses,
      resultatsAgricoles,
    ],
  );

  const indicateurs = [
    {
      titre: "Production",
      valeur: somme(lignes, "production_t"),
      unite: "t",
    },
    {
      titre: "Superficie cultivée",
      valeur: somme(lignes, "superficie_ha"),
      unite: "ha",
    },
    {
      titre: "Rendement",
      valeur: rendement(lignes),
      unite: "t/ha",
    },
    {
      titre: "Précipitations moyennes",
      valeur: moyenneClimat(lignes, "pluie_cumul_mm"),
      unite: "mm",
    },
    {
      titre: "Température moyenne",
      valeur: moyenneClimat(lignes, "tavg_moyenne"),
      unite: "°C",
    },
  ];

  const groupesAnnee = grouper(lignesGraphiques, "annee");
  const annees = Object.keys(groupesAnnee).sort((a, b) => Number(a) - Number(b));
  const anneeSelectionnee = filtres.annee;
  const climatParAnnee = (annee, champ) =>
    moyenneClimat(groupesAnnee[annee], champ);

  const donneesClimatRendement = {
    labels: annees,
    datasets: [
      {
        type: "bar",
        label: `${variableSelectionnee.libelle} (${variableSelectionnee.unite})`,
        data: annees.map((annee) => climatParAnnee(annee, variable)),
        backgroundColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[1] : COULEURS[0],
        ),
        unit: variableSelectionnee.unite,
        lineCounts: annees.map((annee) =>
          compterValeurs(climatUnique(groupesAnnee[annee]), variable),
        ),
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Rendement (t/ha)",
        data: annees.map((annee) => rendement(groupesAnnee[annee])),
        borderColor: COULEURS[1],
        backgroundColor: COULEURS[1],
        pointBackgroundColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[0] : COULEURS[1],
        ),
        pointBorderColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[0] : COULEURS[1],
        ),
        pointRadius: annees.map((annee) =>
          annee === anneeSelectionnee ? 6 : 3,
        ),
        unit: "t/ha",
        lineCounts: annees.map((annee) =>
          compterLignesRendement(groupesAnnee[annee]),
        ),
        yAxisID: "y1",
      },
    ],
  };

  const groupesRegionAnnee = new Map();
  lignesGraphiques.forEach((ligne) => {
    const cle = JSON.stringify([ligne.region, ligne.annee]);
    if (!groupesRegionAnnee.has(cle)) {
      groupesRegionAnnee.set(cle, []);
    }
    groupesRegionAnnee.get(cle).push(ligne);
  });

  const points = climatUnique(lignesGraphiques)
    .map((ligneClimat) => {
      const cle = JSON.stringify([ligneClimat.region, ligneClimat.annee]);
      return {
        region: ligneClimat.region,
        annee: ligneClimat.annee,
        x: ligneClimat[variable],
        y: rendement(groupesRegionAnnee.get(cle) ?? []),
        lignesUtilisees: compterLignesRendement(
          groupesRegionAnnee.get(cle) ?? [],
        ),
      };
    })
    .filter(
      (point) =>
        typeof point.x === "number" &&
        Number.isFinite(point.x) &&
        point.y !== null,
    );
  const regions = [...new Set(points.map((point) => point.region))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const donneesNuage = {
    datasets: regions.map((region, index) => ({
      label: region,
      data: points
        .filter((point) => point.region === region)
        .map(({ x, y, annee, lignesUtilisees }) => ({
          x,
          y,
          annee,
          lignesUtilisees,
        })),
      backgroundColor: points
        .filter((point) => point.region === region)
        .map((point) =>
          String(point.annee) === anneeSelectionnee
            ? COULEURS[1]
            : COULEURS[index % COULEURS.length],
        ),
      pointRadius: points
        .filter((point) => point.region === region)
        .map((point) =>
          String(point.annee) === anneeSelectionnee ? 6 : 3,
        ),
      pointBorderColor: points
        .filter((point) => point.region === region)
        .map((point) =>
          String(point.annee) === anneeSelectionnee
            ? COULEURS[1]
            : COULEURS[index % COULEURS.length],
        ),
      uniteX: variableSelectionnee.unite,
      uniteY: "t/ha",
    })),
  };

  const groupesRegion = grouper(lignes, "region");
  const productionRegions = Object.entries(groupesRegion)
    .map(([region, lignesRegion]) => ({
      region,
      valeur: somme(lignesRegion, "production_t"),
    }))
    .filter((groupe) => groupe.valeur !== null)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 10);

  const donneesProductionRegion = {
    labels: productionRegions.map((groupe) => groupe.region),
    datasets: [
      {
        label: "Production (t)",
        data: productionRegions.map((groupe) => groupe.valeur),
        unit: "t",
        lineCounts: productionRegions.map((groupe) =>
          compterValeurs(groupesRegion[groupe.region], "production_t"),
        ),
        backgroundColor: productionRegions.map(
          (_, index) => COULEURS[index % COULEURS.length],
        ),
      },
    ],
  };

  const donneesEvolutionClimat = {
    labels: annees,
    datasets: [
      {
        type: "bar",
        label: "Pluie (mm)",
        data: annees.map((annee) => climatParAnnee(annee, "pluie_cumul_mm")),
        backgroundColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[1] : COULEURS[0],
        ),
        unit: "mm",
        lineCounts: annees.map((annee) =>
          compterValeurs(
            climatUnique(groupesAnnee[annee]),
            "pluie_cumul_mm",
          ),
        ),
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Température (°C)",
        data: annees.map((annee) =>
          climatParAnnee(annee, "tavg_moyenne"),
        ),
        borderColor: COULEURS[3],
        backgroundColor: COULEURS[3],
        pointBackgroundColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[1] : COULEURS[3],
        ),
        pointBorderColor: annees.map((annee) =>
          annee === anneeSelectionnee ? COULEURS[1] : COULEURS[3],
        ),
        pointRadius: annees.map((annee) =>
          annee === anneeSelectionnee ? 6 : 3,
        ),
        unit: "°C",
        lineCounts: annees.map((annee) =>
          compterValeurs(
            climatUnique(groupesAnnee[annee]),
            "tavg_moyenne",
          ),
        ),
        yAxisID: "y1",
      },
    ],
  };

  const optionsClimatEtRendement = {
    scales: {
      x: { grid: { display: false } },
      y: {
        title: {
          display: true,
          text: `${variableSelectionnee.libelle} (${variableSelectionnee.unite})`,
        },
      },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Rendement (t/ha)" },
      },
    },
  };

  const optionsNuage = {
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: `${variableSelectionnee.libelle} (${variableSelectionnee.unite})`,
        },
      },
      y: {
        title: { display: true, text: "Rendement (t/ha)" },
      },
    },
  };

  const optionsEvolutionClimat = {
    scales: {
      x: { grid: { display: false } },
      y: { title: { display: true, text: "Pluie (mm)" } },
      y1: {
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Température (°C)" },
      },
    },
  };

  const coefficient = correlation(
    points.map((point) => point.x),
    points.map((point) => point.y),
  );

  return (
    <section className="vue-ministere" aria-labelledby="titre-vue">
      <div className="entete-vue">
        <div className="introduction-vue">
          <p className="sur-titre">VUE STRATÉGIQUE</p>
          <h2 id="titre-vue">Vue Ministères</h2>
          <p className="texte-introduction">
            Suivez les productions, les rendements et les conditions
            climatiques selon les filtres sélectionnés.
          </p>
        </div>
        <label className="selecteur-variable">
          Variable climatique
          <select
            value={variable}
            onChange={(evenement) => setVariable(evenement.target.value)}
          >
            {Object.entries(VARIABLES_CLIMATIQUES).map(([cle, definition]) => (
              <option key={cle} value={cle}>
                {definition.libelle} ({definition.unite})
              </option>
            ))}
          </select>
        </label>
      </div>

      {anneeMin !== null && anneeMax !== null && (
        <aside className="info-periode" aria-label="Couverture des données">
          Données agricoles observées de <strong>{anneeMin}</strong> à{" "}
          <strong>{anneeMax}</strong>
          {anneeClimatMin !== null && anneeClimatMax !== null && (
            <>
              {" "}
              · données climatiques observées de <strong>{anneeClimatMin}</strong>{" "}
              à <strong>{anneeClimatMax}</strong>
            </>
          )}
          .
        </aside>
      )}
      {sansClimat && (
        <aside className="info-climat" role="status">
          Pas de données climatiques pour cette sélection. Les indicateurs et
          graphiques climatiques sont indisponibles ; les données agricoles
          restent affichées.
        </aside>
      )}

      <div className="grille-kpi">
        {indicateurs.map((indicateur) => (
          <CarteKpi key={indicateur.titre} {...indicateur} />
        ))}
      </div>

      <div className="grille-ministere-principale">
        <CarteGraphique
          titre="Climat et rendement par année"
          type="bar"
          donnees={donneesClimatRendement}
          options={optionsClimatEtRendement}
          ariaLabel="Graphique du climat et du rendement par année, avec deux axes verticaux"
          onClicElement={({ label }) => onFiltreAnnee(label)}
          sansDonnees={sansClimat}
        />
        <Alertes donnees={donnees} filtres={filtres} />
      </div>

      <div className="grille-graphiques">
        <CarteGraphique
          titre="Climat contre rendement"
          type="scatter"
          donnees={donneesNuage}
          options={optionsNuage}
          ariaLabel="Nuage de points du climat contre le rendement, coloré par région"
          note={`Corrélation : ${
            coefficient === null
              ? "–"
              : coefficient.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
          } (${points.length} ${points.length === 1 ? "point" : "points"}). Une corrélation n'est pas une causalité.`}
          sansDonnees={sansClimat}
        />
        <CarteGraphique
          titre="Évolution du climat"
          type="bar"
          donnees={donneesEvolutionClimat}
          options={optionsEvolutionClimat}
          ariaLabel="Évolution annuelle des précipitations et de la température"
          onClicElement={({ label }) => onFiltreAnnee(label)}
          sansDonnees={sansClimat}
        />
        <CarteGraphique
          titre="Production par région"
          donnees={donneesProductionRegion}
          options={{ scales: { x: { grid: { display: false } } } }}
          ariaLabel="Production par région, classée par ordre décroissant"
          onClicElement={({ label }) => onFiltreRegion(label)}
        />
        <CarteSenegal
          donnees={donnees}
          lignes={lignesCarte}
          niveauxVulnerabilite={niveauxVulnerabilite}
          filtres={filtres}
          onFiltreRegion={onFiltreRegion}
        />
      </div>
      <ModuleVulnerabilite
        donnees={donnees}
        niveaux={niveauxVulnerabilite}
        resultatsAgricoles={resultatsAgricoles}
        filtres={filtres}
        annee={anneeAnalyse}
        onFiltreRegion={onFiltreRegion}
        inclureDouteuses={inclureDouteuses}
        onInclureDouteuses={setInclureDouteuses}
      />
    </section>
  );
}
