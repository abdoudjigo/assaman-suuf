// Permet de choisir le profil d'analyse avec des boutons accessibles au clavier.
export default function Onglets({ vueActive, onChangerVue }) {
  const vues = [
    { id: "ministere", libelle: "Ministères" },
    { id: "ong", libelle: "ONG" },
  ];

  return (
    <nav className="conteneur navigation" aria-label="Choix de la vue">
      {vues.map((vue) => (
        <button
          key={vue.id}
          className={`onglet${vueActive === vue.id ? " actif" : ""}`}
          type="button"
          aria-current={vueActive === vue.id ? "page" : undefined}
          onClick={() => onChangerVue(vue.id)}
        >
          {vue.libelle}
        </button>
      ))}
    </nav>
  );
}
