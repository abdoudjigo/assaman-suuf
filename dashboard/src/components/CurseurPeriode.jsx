// Offre deux curseurs indépendants pour définir une plage d'années inclusive.
export default function CurseurPeriode({
  annees,
  debut,
  fin,
  onChanger,
  disabled = false,
}) {
  if (!annees.length) {
    return null;
  }

  const minimum = annees[0];
  const maximum = annees[annees.length - 1];

  return (
    <fieldset className="curseur-periode" disabled={disabled}>
      <legend>Période</legend>
      <label>
        De l’année {debut}
        <input
          type="range"
          min={minimum}
          max={maximum}
          step="1"
          value={debut}
          aria-label={`Année de début, ${debut}`}
          onChange={(evenement) => {
            const nouvelleValeur = Number(evenement.target.value);
            onChanger({
              debut: nouvelleValeur,
              fin: Math.max(nouvelleValeur, fin),
            });
          }}
        />
      </label>
      <label>
        À l’année {fin}
        <input
          type="range"
          min={minimum}
          max={maximum}
          step="1"
          value={fin}
          aria-label={`Année de fin, ${fin}`}
          onChange={(evenement) => {
            const nouvelleValeur = Number(evenement.target.value);
            onChanger({
              debut: Math.min(debut, nouvelleValeur),
              fin: nouvelleValeur,
            });
          }}
        />
      </label>
      {disabled && (
        <p className="note-periode">
          La période est ignorée tant qu’une année précise est sélectionnée.
        </p>
      )}
    </fieldset>
  );
}
