import CarteKpi from "./CarteKpi.jsx";
import GraphiqueRendementNormale from "./GraphiqueRendementNormale.jsx";
import TableauZonesASurveiller from "./TableauZonesASurveiller.jsx";
import {
  HISTORIQUE_MINIMUM,
  SEUIL_ANOMALIE_AGRICOLE,
  SEUIL_PLUIE_EXCES_MM,
  SEUIL_PLUIE_MM,
  SEUIL_TEMPERATURE,
} from "../config.js";
import { NIVEAUX_VULNERABILITE } from "../utils/anomalies.js";

const COULEURS_NIVEAUX = {
  [NIVEAUX_VULNERABILITE.VULNERABLE]: "var(--alerte)",
  [NIVEAUX_VULNERABILITE.SURVEILLANCE]: "var(--soleil)",
  [NIVEAUX_VULNERABILITE.NORMAL]: "var(--vert)",
  [NIVEAUX_VULNERABILITE.NON_EVALUABLE]: "var(--sans-donnee)",
};

// Regroupe les indicateurs régionaux, les explications et la série historique.
export default function ModuleVulnerabilite({
  donnees,
  niveaux,
  resultatsAgricoles,
  filtres,
  annee,
  onFiltreRegion,
  inclureDouteuses,
  onInclureDouteuses,
}) {
  const comptes = Object.values(NIVEAUX_VULNERABILITE).reduce(
    (resultat, niveau) => ({
      ...resultat,
      [niveau]: niveaux.filter(
        (entree) => (entree.niveauKpi ?? entree.niveau) === niveau,
      ).length,
    }),
    {},
  );
  const lignesAvecClimat = niveaux.filter((entree) => entree.climatDisponible)
    .length;

  return (
    <section className="module-vulnerabilite" aria-labelledby="titre-vulnerabilite">
      <div className="entete-module-vulnerabilite">
        <div>
          <h3 id="titre-vulnerabilite">
            Anomalies agricoles et zones à vulnérabilité
          </h3>
          <p>Année analysée : {annee ?? "–"}</p>
          <p className="description-vulnerabilite">
            Synthèse des anomalies et du niveau évalué pour chaque région.
          </p>
        </div>
        <label className="case-donnees-douteuses">
          <input
            type="checkbox"
            checked={inclureDouteuses}
            onChange={(evenement) =>
              onInclureDouteuses(evenement.target.checked)
            }
          />
          Inclure les données douteuses
        </label>
      </div>

      {lignesAvecClimat === 0 && (
        <aside className="info-climat" role="status">
          Le climat est indisponible pour cette sélection ; le niveau repose
          uniquement sur les anomalies agricoles.
        </aside>
      )}

      <div className="grille-kpi grille-kpi-vulnerabilite">
        {[
          NIVEAUX_VULNERABILITE.VULNERABLE,
          NIVEAUX_VULNERABILITE.SURVEILLANCE,
          NIVEAUX_VULNERABILITE.NORMAL,
          NIVEAUX_VULNERABILITE.NON_EVALUABLE,
        ].map((niveau) => (
          <CarteKpi
            key={niveau}
            titre={
              niveau === NIVEAUX_VULNERABILITE.NON_EVALUABLE
                ? "Non évaluable (climat ou historique)"
                : niveau
            }
            valeur={comptes[niveau]}
            unite="régions"
            couleur={COULEURS_NIVEAUX[niveau]}
            animerValeur={false}
          />
        ))}
      </div>

      <div className="grille-details-vulnerabilite">
        <TableauZonesASurveiller
          lignes={niveaux}
          onFiltreRegion={onFiltreRegion}
          regionSelectionnee={filtres.region}
        />

        <GraphiqueRendementNormale
          lignes={donnees}
          resultats={resultatsAgricoles}
          region={filtres.region}
          produit={filtres.produit}
          departement={filtres.departement}
          inclureDouteuses={inclureDouteuses}
        />
      </div>

      <details className="explication-vulnerabilite">
        <summary>Comment est-ce calculé ?</summary>
        <div>
          <p>
            Pour chaque région et produit, le rendement annuel est calculé en
            divisant la production totale par la superficie totale des lignes
            complètes. Les rendements annuels sont comparés à leur médiane
            historique avec le score robuste 0,6745 × (rendement − médiane) /
            MAD. Si le MAD est nul, le score vaut zéro ; il faut au moins{" "}
            {HISTORIQUE_MINIMUM} années valides.
          </p>
          <p>
            Une anomalie agricole correspond à un score inférieur ou égal à{" "}
            {SEUIL_ANOMALIE_AGRICOLE}. Une anomalie climatique est une pluie
            inférieure à {SEUIL_PLUIE_MM} mm ou une anomalie de température
            supérieure ou égale à {SEUIL_TEMPERATURE} °C
            {SEUIL_PLUIE_EXCES_MM === null
              ? "; aucun seuil de pluie excédentaire n'est actif"
              : ` ; une pluie excédentaire ou égale à ${SEUIL_PLUIE_EXCES_MM} mm est aussi considérée anormale`}
            . Le climat est compté une seule fois par région et par année. Les
            données douteuses (indicateur qualité = 1) sont exclues par défaut.
          </p>
          <p>
            Vulnérable signifie anomalie agricole et climatique ; Surveillance
            signifie une seule des deux ; Normal signifie aucune. Si le climat
            est indisponible, le niveau repose sur l’anomalie agricole seule.
            L’historique insuffisant est indiqué comme Non évaluable.
          </p>
          <p>
            Ces indicateurs signalent des écarts par rapport à l'historique. Ils
            n'établissent pas de cause : une corrélation n'est pas une causalité.
          </p>
        </div>
      </details>
    </section>
  );
}
