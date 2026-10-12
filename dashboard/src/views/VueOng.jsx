import { useState } from "react";
import CarteGraphique from "../components/CarteGraphique.jsx";
import { COULEURS } from "../config.js";
import {
  compterLignesRendement,
  compterValeurs,
  grouper,
  rendement,
  somme,
  valeursUniques,
} from "../utils/calculs.js";

// Formate les mesures agricoles sans afficher de zéro lorsqu'elles sont absentes.
function formaterMesure(valeur, decimales = 0) {
  return valeur === null || valeur === undefined
    ? "–"
    : valeur.toLocaleString("fr-FR", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
      });
}

// Présente les productions, rendements, évolutions et classements utiles aux ONG.
export default function VueOng({
  filtres,
  lignes,
  onFiltreAnnee,
  onFiltreRegion,
  onFiltreProduit,
}) {
  const [tri, setTri] = useState({ cle: "rendement", direction: "desc" });
  const groupesProduit = grouper(lignes, "produit");
  const productionProduits = Object.entries(groupesProduit)
    .map(([produit, lignesProduit]) => ({
      produit,
      valeur: somme(lignesProduit, "production_t"),
    }))
    .filter((groupe) => groupe.valeur !== null)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 10);
  const rendementProduits = Object.entries(groupesProduit)
    .map(([produit, lignesProduit]) => ({
      produit,
      valeur: rendement(lignesProduit),
    }))
    .filter((groupe) => groupe.valeur !== null)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 10);

  const donneesProduction = {
    labels: productionProduits.map((groupe) => groupe.produit),
    datasets: [
      {
        label: "Production (t)",
        data: productionProduits.map((groupe) => groupe.valeur),
        unit: "t",
        lineCounts: productionProduits.map((groupe) =>
          compterValeurs(groupesProduit[groupe.produit], "production_t"),
        ),
        backgroundColor: productionProduits.map(
          (_, index) => COULEURS[index % COULEURS.length],
        ),
      },
    ],
  };
  const donneesRendement = {
    labels: rendementProduits.map((groupe) => groupe.produit),
    datasets: [
      {
        label: "Rendement (t/ha)",
        data: rendementProduits.map((groupe) => groupe.valeur),
        unit: "t/ha",
        lineCounts: rendementProduits.map((groupe) =>
          compterLignesRendement(groupesProduit[groupe.produit]),
        ),
        backgroundColor: rendementProduits.map(
          (_, index) => COULEURS[index % COULEURS.length],
        ),
      },
    ],
  };

  const groupesParProduit = grouper(lignes, "produit");
  const produitsLesPlusProduits = Object.entries(groupesParProduit)
    .map(([produit, lignesProduit]) => ({
      produit,
      lignes: lignesProduit,
      production: somme(lignesProduit, "production_t"),
    }))
    .filter((groupe) => groupe.production !== null)
    .sort((a, b) => b.production - a.production)
    .slice(0, 5);
  const annees = valeursUniques(lignes, "annee");
  const donneesEvolutionRendement = {
    labels: annees,
    datasets: produitsLesPlusProduits.map((groupe, index) => {
      const lignesParAnnee = grouper(groupe.lignes, "annee");
      return {
        label: groupe.produit,
        data: annees.map((annee) =>
          rendement(lignesParAnnee[annee] ?? []),
        ),
        unit: "t/ha",
        lineCounts: annees.map((annee) =>
          compterLignesRendement(lignesParAnnee[annee] ?? []),
        ),
        borderColor: COULEURS[index % COULEURS.length],
        backgroundColor: COULEURS[index % COULEURS.length],
        pointRadius: 3,
      };
    }),
  };

  const classementInitial = Object.entries(grouper(lignes, "region"))
    .map(([region, lignesRegion]) => ({
      region,
      rendement: rendement(lignesRegion),
      production: somme(lignesRegion, "production_t"),
    }))
    .filter((groupe) => groupe.rendement !== null)
    .sort((a, b) => b.rendement - a.rendement)
    .map((groupe, index) => ({ ...groupe, rang: index + 1 }));
  const classement = [...classementInitial].sort((a, b) => {
    const valeurA = a[tri.cle];
    const valeurB = b[tri.cle];
    if (valeurA === null || valeurA === undefined) {
      return valeurB === null || valeurB === undefined ? 0 : 1;
    }
    if (valeurB === null || valeurB === undefined) {
      return -1;
    }
    const comparaison =
      typeof valeurA === "string"
        ? valeurA.localeCompare(valeurB, "fr")
        : valeurA - valeurB;
    return tri.direction === "asc" ? comparaison : -comparaison;
  });

  function changerTri(cle) {
    setTri((actuel) => ({
      cle,
      direction:
        actuel.cle === cle
          ? actuel.direction === "asc"
            ? "desc"
            : "asc"
          : cle === "region"
            ? "asc"
            : "desc",
    }));
  }

  function enteteTri(cle, libelle) {
    const actif = tri.cle === cle;
    const direction = actif
      ? tri.direction === "asc"
        ? "ascending"
        : "descending"
      : "none";

    return (
      <th key={cle} scope="col" aria-sort={direction}>
        <button
          className="bouton-tri"
          type="button"
          onClick={() => changerTri(cle)}
        >
          {libelle}
          {actif ? (tri.direction === "asc" ? " ▲" : " ▼") : ""}
        </button>
      </th>
    );
  }

  const optionsBarres = {
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } } },
  };
  const optionsRendement = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { title: { display: true, text: "Rendement (t/ha)" } },
    },
  };
  const optionsEvolution = {
    scales: {
      x: { grid: { display: false } },
      y: { title: { display: true, text: "Rendement (t/ha)" } },
    },
  };

  return (
    <section className="vue-ong" aria-labelledby="titre-vue">
      <div className="entete-vue">
        <div className="introduction-vue">
          <p className="sur-titre">SUIVI OPÉRATIONNEL</p>
          <h2 id="titre-vue">Vue ONG</h2>
          <p className="texte-introduction">
            Explorez les volumes, les rendements et leur évolution pour les
            cultures et régions sélectionnées.
          </p>
        </div>
      </div>

      <div className="grille-graphiques">
        <CarteGraphique
          titre="Production par produit"
          donnees={donneesProduction}
          options={optionsBarres}
          ariaLabel="Production agricole par produit, dix premiers produits"
          onClicElement={({ label }) => onFiltreProduit(label)}
        />
        <CarteGraphique
          titre="Rendement par produit"
          donnees={donneesRendement}
          options={optionsRendement}
          ariaLabel="Rendement agricole par produit, dix premiers produits"
          onClicElement={({ label }) => onFiltreProduit(label)}
        />
        <CarteGraphique
          titre="Évolution du rendement"
          type="line"
          donnees={donneesEvolutionRendement}
          options={optionsEvolution}
          ariaLabel="Évolution annuelle du rendement pour les cinq produits les plus produits"
          onClicElement={({ label }) => onFiltreAnnee(label)}
        />
        <article
          className="carte-graphique carte-classement"
          aria-labelledby="titre-classement-regions"
        >
          <div className="entete-classement">
            <div>
              <h3 id="titre-classement-regions">Classement des régions</h3>
              <p>Rendement et production selon les critères actifs.</p>
            </div>
            <span className="compte-regions">
              {classement.length}{" "}
              {classement.length === 1 ? "région" : "régions"}
            </span>
          </div>
          <div className="conteneur-tableau">
            <table aria-label="Classement agricole des régions">
              <thead>
                <tr>
                  {enteteTri("rang", "Rang")}
                  {enteteTri("region", "Région")}
                  {enteteTri("rendement", "Rendement (t/ha)")}
                  {enteteTri("production", "Production (t)")}
                </tr>
              </thead>
              <tbody>
                {classement.map((groupe, index) => (
                  <tr key={groupe.region}>
                    <td>{index + 1}</td>
                    <td>
                      <button
                        className="bouton-region"
                        type="button"
                        aria-pressed={filtres.region === groupe.region}
                        onClick={() => onFiltreRegion(groupe.region)}
                      >
                        {groupe.region}
                      </button>
                    </td>
                    <td>{formaterMesure(groupe.rendement, 2)}</td>
                    <td>{formaterMesure(groupe.production)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
