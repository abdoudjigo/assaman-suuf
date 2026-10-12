// Présente chaque critère actif sous forme de pastille supprimable.
export default function FiltresActifs({
  filtres,
  onRetirer,
  periode,
  bornes,
  onReinitialiserPeriode,
}) {
  const libelles = {
    annee: "Campagne",
    region: "Région",
    departement: "Département",
    produit: "Culture",
  };
  const actifs = Object.entries(libelles).filter(([cle]) => filtres[cle]);
  const periodePersonnalisee =
    periode.debut !== bornes.debut || periode.fin !== bornes.fin;

  if (!actifs.length && !periodePersonnalisee) {
    return null;
  }

  return (
    <div className="conteneur filtres-actifs" aria-label="Filtres actifs">
      {actifs.map(([cle, libelle]) => (
        <button
          key={cle}
          className="pastille-filtre"
          type="button"
          onClick={() => onRetirer(cle)}
          aria-label={`Retirer le filtre ${libelle} ${filtres[cle]}`}
        >
          {libelle} : {filtres[cle]} <span aria-hidden="true">×</span>
        </button>
      ))}
      {periodePersonnalisee && (
        <button
          className="pastille-filtre"
          type="button"
          onClick={onReinitialiserPeriode}
          aria-label={`Réinitialiser la période ${periode.debut} à ${periode.fin}`}
        >
          Période : {periode.debut}–{periode.fin}{" "}
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
