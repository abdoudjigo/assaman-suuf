import { useEffect, useMemo, useState } from "react";
import CurseurPeriode from "./components/CurseurPeriode.jsx";
import Header from "./components/Header.jsx";
import Filtres from "./components/Filtres.jsx";
import FiltresActifs from "./components/FiltresActifs.jsx";
import Onglets from "./components/Onglets.jsx";
import useDonnees from "./hooks/useDonnees.js";
import { filtrerLignes, valeursUniques } from "./utils/calculs.js";
import VueMinistere from "./views/VueMinistere.jsx";
import VueOng from "./views/VueOng.jsx";

// Relit les filtres partagés dans l'URL au premier affichage.
function lireFiltresURL() {
  const parametres = new URLSearchParams(window.location.search);
  return {
    annee: parametres.get("annee") ?? "",
    region: parametres.get("region") ?? "",
    departement: parametres.get("departement") ?? "",
    produit: parametres.get("produit") ?? "",
  };
}

// Relit les bornes de période partagées dans l'URL si elles existent.
function lirePeriodeURL() {
  const parametres = new URLSearchParams(window.location.search);
  const debut = Number(parametres.get("debut"));
  const fin = Number(parametres.get("fin"));
  return {
    debut: Number.isFinite(debut) && parametres.has("debut") ? debut : null,
    fin: Number.isFinite(fin) && parametres.has("fin") ? fin : null,
  };
}

// Relie le chargement des données, les filtres partagés et les deux profils.
export default function App() {
  const [vueActive, setVueActive] = useState("ministere");
  const [theme, setTheme] = useState("light");
  const [filtres, setFiltres] = useState(lireFiltresURL);
  const [periode, setPeriode] = useState(lirePeriodeURL);
  const { donnees, chargement, erreur, progression, reessayer } = useDonnees();
  const annees = useMemo(
    () => valeursUniques(donnees, "annee"),
    [donnees],
  );
  const anneeMin = annees[0] ?? null;
  const anneeMax = annees[annees.length - 1] ?? null;
  const bornesPeriode = useMemo(() => {
    if (anneeMin === null || anneeMax === null) {
      return { debut: null, fin: null };
    }

    const debut = Math.max(
      anneeMin,
      Math.min(anneeMax, periode.debut ?? anneeMin),
    );
    const fin = Math.max(
      debut,
      Math.min(anneeMax, periode.fin ?? anneeMax),
    );
    return { debut, fin };
  }, [anneeMin, anneeMax, periode]);
  const lignesFiltrees = useMemo(
    () =>
      filtrerLignes(donnees, filtres).filter(
        (ligne) =>
          filtres.annee ||
          (ligne.annee >= bornesPeriode.debut &&
            ligne.annee <= bornesPeriode.fin),
      ),
    [donnees, filtres, bornesPeriode],
  );
  const lignesCarte = useMemo(
    () =>
      filtrerLignes(donnees, {
        annee: filtres.annee,
        departement: filtres.departement,
        produit: filtres.produit,
        region: "",
      }).filter(
        (ligne) =>
          filtres.annee ||
          (ligne.annee >= bornesPeriode.debut &&
            ligne.annee <= bornesPeriode.fin),
      ),
    [
      donnees,
      filtres.annee,
      filtres.departement,
      filtres.produit,
      bornesPeriode,
    ],
  );
  const lignesGraphiquesMinistere = useMemo(() => {
    const selection = filtrerLignes(donnees, {
      ...filtres,
      annee: "",
    });
    if (filtres.annee) {
      return selection;
    }

    return selection.filter(
      (ligne) =>
        ligne.annee >= bornesPeriode.debut &&
        ligne.annee <= bornesPeriode.fin,
    );
  }, [donnees, filtres, bornesPeriode]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.dispatchEvent(new Event("themechange"));
  }, [theme]);

  // Maintient les filtres et la période visibles dans l'adresse de la vue.
  useEffect(() => {
    if (!donnees.length) {
      return;
    }

    const url = new URL(window.location.href);
    Object.entries(filtres).forEach(([cle, valeur]) => {
      if (valeur) {
        url.searchParams.set(cle, valeur);
      } else {
        url.searchParams.delete(cle);
      }
    });

    if (
      bornesPeriode.debut !== null &&
      (bornesPeriode.debut !== anneeMin || bornesPeriode.fin !== anneeMax)
    ) {
      url.searchParams.set("debut", String(bornesPeriode.debut));
      url.searchParams.set("fin", String(bornesPeriode.fin));
    } else {
      url.searchParams.delete("debut");
      url.searchParams.delete("fin");
    }

    if (url.href !== window.location.href) {
      window.history.replaceState(null, "", url);
    }
  }, [anneeMax, anneeMin, bornesPeriode, donnees.length, filtres]);

  // Retire un seul critère et enlève le département lié si la région disparaît.
  function retirerFiltre(champ) {
    setFiltres((actuels) => ({
      ...actuels,
      [champ]: "",
      ...(champ === "region" ? { departement: "" } : {}),
    }));
  }

  // Un nouveau clic sur la valeur déjà sélectionnée annule le filtre croisé.
  function basculerFiltre(champ, valeur) {
    setFiltres((actuels) => {
      const valeurTexte = String(valeur);
      const valeurSuivante = actuels[champ] === valeurTexte ? "" : valeurTexte;
      return {
        ...actuels,
        [champ]: valeurSuivante,
        ...(champ === "region" ? { departement: "" } : {}),
      };
    });
  }

  // Réinitialise les critères et la période sur l'ensemble des années disponibles.
  function reinitialiserFiltres() {
    setFiltres({ annee: "", region: "", departement: "", produit: "" });
    setPeriode({ debut: anneeMin, fin: anneeMax });
  }

  return (
    <div className="app-shell">
      <aside className="barre-laterale">
        <Header
          theme={theme}
          onChangerTheme={() =>
            setTheme((actuel) => (actuel === "light" ? "dark" : "light"))
          }
        />
        <Onglets vueActive={vueActive} onChangerVue={setVueActive} />
      </aside>
      <div className="zone-application">
      {!chargement && !erreur && donnees.length > 0 && (
        <Filtres
          donnees={donnees}
          filtres={filtres}
          onChanger={setFiltres}
          onReinitialiser={reinitialiserFiltres}
        />
      )}
      {!chargement && !erreur && donnees.length > 0 && (
        <>
          <CurseurPeriode
            annees={annees}
            debut={bornesPeriode.debut}
            fin={bornesPeriode.fin}
            onChanger={setPeriode}
            disabled={Boolean(filtres.annee)}
          />
          <FiltresActifs
            filtres={filtres}
            onRetirer={retirerFiltre}
            periode={bornesPeriode}
            bornes={{ debut: anneeMin, fin: anneeMax }}
            onReinitialiserPeriode={() =>
              setPeriode({ debut: anneeMin, fin: anneeMax })
            }
          />
        </>
      )}
      <main className="contenu-principal">
        {chargement && (
          <div className="chargement-donnees" role="status" aria-live="polite">
            <p>
              Chargement des données
              {progression.total > 0
                ? ` — ${progression.pagesChargees} ${
                    progression.pagesChargees === 1 ? "page" : "pages"
                  } sur ${progression.total}`
                : "…"}
            </p>
            {progression.total > 0 && (
              <div
                className="barre-progression"
                role="progressbar"
                aria-label="Progression du chargement des données"
                aria-valuemin="0"
                aria-valuemax={progression.total}
                aria-valuenow={progression.pagesChargees}
              >
                <span
                  style={{
                    width: `${(progression.pagesChargees / progression.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
        {erreur && (
          <div className="message-erreur" role="alert">
            <p>Impossible de charger les données : {erreur.message}</p>
            <button className="bouton-secondaire" type="button" onClick={reessayer}>
              Réessayer
            </button>
          </div>
        )}
        {!chargement && !erreur && donnees.length === 0 && (
          <p className="message-etat" role="status">
            Aucune donnée n’est disponible.
          </p>
        )}
        {!chargement && !erreur && donnees.length > 0 && lignesFiltrees.length === 0 && (
          <p className="message-etat" role="status">
            Aucune ligne ne correspond aux filtres sélectionnés.
          </p>
        )}
        {!chargement && !erreur && donnees.length > 0 && (
          <>
            {vueActive === "ministere" ? (
              <VueMinistere
                donnees={donnees}
                filtres={filtres}
                lignes={lignesFiltrees}
                lignesCarte={lignesCarte}
                lignesGraphiques={lignesGraphiquesMinistere}
                onFiltreAnnee={(annee) => basculerFiltre("annee", annee)}
                onFiltreRegion={(region) => basculerFiltre("region", region)}
              />
            ) : (
              <VueOng
                donnees={donnees}
                filtres={filtres}
                lignes={lignesFiltrees}
                onFiltreAnnee={(annee) => basculerFiltre("annee", annee)}
                onFiltreRegion={(region) => basculerFiltre("region", region)}
                onFiltreProduit={(produit) => basculerFiltre("produit", produit)}
              />
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}
