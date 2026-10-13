import { SEUIL_ALERTE_MM } from "../config.js";
import { climatUnique } from "../utils/calculs.js";

// Affiche les anomalies de pluie de l'année choisie, ou de la plus récente connue.
export default function Alertes({ donnees, filtres }) {
  const climat = climatUnique(
    donnees.filter((ligne) => !filtres.region || ligne.region === filtres.region),
  );

  if (!climat.length) {
    return null;
  }

  const derniereAnnee = Math.max(...climat.map((ligne) => ligne.annee));
  const anneeCible = filtres.annee || String(derniereAnnee);
  const alertes = climat.filter(
    (ligne) =>
      String(ligne.annee) === anneeCible &&
      typeof ligne.pluie_anomalie_mm === "number" &&
      ligne.pluie_anomalie_mm < SEUIL_ALERTE_MM,
  );

  return (
    <article className="carte-alertes" aria-labelledby="titre-alertes" role="status">
      <div className="entete-alertes">
        <h3 id="titre-alertes">Alertes climatiques</h3>
        <span className="compte-alertes">{alertes.length}</span>
      </div>
      {alertes.length ? (
        <ul>
          {alertes.map((ligne) => (
            <li key={`${ligne.region}-${ligne.annee}`}>
              <span className="badge-alerte">PLUIE</span>
              <div>
                <strong>{ligne.region}</strong>
                <p>
                  {ligne.pluie_anomalie_mm.toLocaleString("fr-FR", {
                    maximumFractionDigits: 1,
                  })}{" "}
                  mm sous la normale · {ligne.annee}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aucune-alerte">
          Aucune anomalie pluviométrique sous le seuil d’alerte pour cette
          sélection.
        </p>
      )}
    </article>
  );
}
