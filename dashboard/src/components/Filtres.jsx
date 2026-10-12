import { valeursUniques } from "../utils/calculs.js";

// Affiche les filtres communs, avec les départements limités à la région choisie.
export default function Filtres({ donnees, filtres, onChanger, onReinitialiser }) {
  const regions = valeursUniques(donnees, "region");
  const lignesRegion = filtres.region
    ? donnees.filter((ligne) => ligne.region === filtres.region)
    : donnees;
  const departements = valeursUniques(lignesRegion, "departement");
  const produits = valeursUniques(donnees, "produit");
  const annees = valeursUniques(donnees, "annee").reverse();

  function changer(champ, valeur) {
    onChanger((anciens) => ({
      ...anciens,
      [champ]: valeur,
      ...(champ === "region" ? { departement: "" } : {}),
    }));
  }

  return (
    <section className="conteneur filtres" aria-label="Filtres des données">
      <label>
        Campagne
        <select
          value={filtres.annee}
          onChange={(evenement) => changer("annee", evenement.target.value)}
        >
          <option value="">Toutes les campagnes</option>
          {annees.map((annee) => (
            <option key={annee} value={annee}>
              {annee}
            </option>
          ))}
        </select>
      </label>
      <label>
        Culture
        <select
          value={filtres.produit}
          onChange={(evenement) => changer("produit", evenement.target.value)}
        >
          <option value="">Toutes les cultures</option>
          {produits.map((produit) => (
            <option key={produit} value={produit}>
              {produit}
            </option>
          ))}
        </select>
      </label>
      <label>
        Région
        <select
          value={filtres.region}
          onChange={(evenement) => changer("region", evenement.target.value)}
        >
          <option value="">Toutes</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>
      <label>
        Département
        <select
          value={filtres.departement}
          onChange={(evenement) => changer("departement", evenement.target.value)}
        >
          <option value="">Tous</option>
          {departements.map((departement) => (
            <option key={departement} value={departement}>
              {departement}
            </option>
          ))}
        </select>
      </label>
      <button className="bouton-secondaire" type="button" onClick={onReinitialiser}>
        Réinitialiser les filtres
      </button>
    </section>
  );
}
