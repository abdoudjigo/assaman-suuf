// Affiche l'identité du projet dans la barre latérale.
export default function Header({ theme, onChangerTheme }) {
  return (
    <header className="entete">
      <div className="conteneur entete-contenu">
        <img
          className="logo"
          src="/logo.png"
          alt="Assaman & Suuf"
          width="48"
          height="48"
        />
        <div>
          <h1>Assaman &amp; Suuf</h1>
          <p>Ciel &amp; Terre · DataFlow360</p>
        </div>
      </div>
      <button
        className="bouton-theme"
        type="button"
        onClick={onChangerTheme}
        aria-label={`Activer le thème ${theme === "light" ? "sombre" : "clair"}`}
        aria-pressed={theme === "dark"}
      >
        {theme === "light" ? "Mode sombre" : "Mode clair"}
      </button>
    </header>
  );
}
