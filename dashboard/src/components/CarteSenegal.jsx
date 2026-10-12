import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  useMap,
} from "react-leaflet";
import {
  calculerValeursCarte,
  couleurSelonValeur,
  normaliserNom,
  obtenirLegende,
  obtenirCorrespondances,
  VARIABLES_CARTE,
} from "../utils/carte.js";
import { appliquerPaletteTheme } from "../utils/couleursTheme.js";

const SOURCE_GEOJSON =
  "https://github.com/wmgeolab/geoBoundaries/tree/9469f09/releaseData/gbOpen/SEN/ADM1";

// Charge les limites ADM1 depuis les fichiers statiques du dashboard.
async function chargerRegions(signal) {
  const reponse = await fetch("/senegal-regions.geojson", { signal });
  if (!reponse.ok) {
    throw new Error(
      `Impossible de charger les limites régionales (HTTP ${reponse.status}).`,
    );
  }

  const geojson = await reponse.json();
  if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("Le fichier des limites régionales n'est pas un GeoJSON valide.");
  }
  return geojson;
}

// Centre la carte sur les limites exactes du GeoJSON, sans coordonnées inventées.
function AjusterVue({ geojson }) {
  const carte = useMap();

  useEffect(() => {
    carte.fitBounds(L.geoJSON(geojson).getBounds(), { padding: [20, 20] });
  }, [carte, geojson]);

  return null;
}

// Rend la référence Leaflet disponible au bouton de recentrage placé hors carte.
function CapturerCarte({ referenceCarte }) {
  const carte = useMap();

  useEffect(() => {
    referenceCarte.current = carte;
    return () => {
      referenceCarte.current = null;
    };
  }, [carte, referenceCarte]);

  return null;
}

// Affiche l'origine des polygones sans dépendre d'un fournisseur de tuiles.
function AttributionGeoBoundaries() {
  const carte = useMap();

  useEffect(() => {
    const attribution =
      '<a href="https://www.geoboundaries.org/">geoBoundaries</a>';
    carte.attributionControl.setPrefix(false);
    carte.attributionControl.addAttribution(attribution);
    return () => carte.attributionControl.removeAttribution(attribution);
  }, [carte]);

  return null;
}

function formaterValeur(valeur, unite) {
  if (valeur === null || !Number.isFinite(valeur)) {
    return "–";
  }

  return `${valeur.toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  })} ${unite}`;
}

// Construit une infobulle avec du texte DOM pour ne pas injecter de HTML API.
function creerContenuInfobulle(feature, etat) {
  const contenu = document.createElement("div");
  const titre = document.createElement("strong");
  const detail = document.createElement("div");
  const lignes = document.createElement("small");
  const nom = feature.properties?.shapeName ?? "Région";
  const entree = etat.valeurs.get(normaliserNom(nom));
  const definition = VARIABLES_CARTE[etat.variable];

  titre.textContent = nom;
  if (!entree || entree.valeur === null) {
    detail.textContent =
      definition.categorique
        ? "Historique insuffisant pour évaluer cette région"
        : definition.climat
        ? "Pas de données climatiques pour cette région"
        : "Pas de données agricoles pour cette région";
    lignes.textContent = "Lignes utilisées : 0";
  } else {
    detail.textContent = definition.categorique
      ? `${entree.valeur}${
          !entree.climatDisponible && entree.valeur !== "Non évaluable"
            ? " · climat indisponible : anomalie agricole seule"
            : ""
        }`
      : formaterValeur(entree.valeur, definition.unite);
    lignes.textContent = `Lignes utilisées : ${entree.lignesUtilisees}`;
  }

  contenu.append(titre, detail, lignes);
  return contenu;
}

// Affiche une carte régionale avec une choroplèthe recalculée dans le navigateur.
export default function CarteSenegal({
  donnees,
  lignes,
  niveauxVulnerabilite,
  filtres,
  onFiltreRegion,
}) {
  const [variable, setVariable] = useState("rendement_t_ha");
  const [geojson, setGeojson] = useState(null);
  const [erreur, setErreur] = useState("");
  const [tableauVisible, setTableauVisible] = useState(false);
  const [revisionTheme, setRevisionTheme] = useState(0);
  const referenceCarte = useRef(null);
  const definition = VARIABLES_CARTE[variable];
  const bornes = useMemo(
    () => (geojson ? L.geoJSON(geojson).getBounds() : undefined),
    [geojson],
  );

  useEffect(() => {
    const controleur = new AbortController();
    chargerRegions(controleur.signal)
      .then(setGeojson)
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setErreur(cause.message);
        }
      });

    return () => controleur.abort();
  }, []);

  useEffect(() => {
    const actualiserTheme = () =>
      setRevisionTheme((revision) => revision + 1);
    window.addEventListener("themechange", actualiserTheme);
    return () => window.removeEventListener("themechange", actualiserTheme);
  }, []);

  const valeurs = useMemo(
    () => calculerValeursCarte(lignes, variable, niveauxVulnerabilite),
    [lignes, variable, niveauxVulnerabilite],
  );
  const domaines = useMemo(() => {
    const valides = [...valeurs.values()]
      .map((entree) => entree.valeur)
      .filter((valeur) => typeof valeur === "number" && Number.isFinite(valeur));

    return valides.length
      ? { min: Math.min(...valides), max: Math.max(...valides) }
      : null;
  }, [valeurs]);
  const legende = obtenirLegende(domaines, variable);
  const valeurRegionSelectionnee = filtres.region
    ? valeurs.get(normaliserNom(filtres.region))
    : null;
  const valeurAffichee =
    valeurRegionSelectionnee?.valeur === null ||
    valeurRegionSelectionnee?.valeur === undefined
      ? "–"
      : definition.categorique
        ? valeurRegionSelectionnee.valeur
        : formaterValeur(valeurRegionSelectionnee.valeur, definition.unite);
  const nomsRegionApi = useMemo(
    () =>
      new Map(
        donnees
          .map((ligne) => ligne.region)
          .filter((region) => region !== null && region !== undefined)
          .map((region) => [normaliserNom(region), region]),
      ),
    [donnees],
  );
  const etatCarteRef = useRef(null);
  etatCarteRef.current = {
    valeurs,
    variable,
    onFiltreRegion,
    nomsRegionApi,
  };

  useEffect(() => {
    if (!geojson) {
      return;
    }

    const regionsApi = [
      ...new Set(
        donnees
          .map((ligne) => ligne.region)
          .filter((region) => region !== null && region !== undefined),
      ),
    ];
    const correspondances = obtenirCorrespondances(regionsApi, geojson);
    console.info(
      "Régions de l’API sans correspondance sur la carte :",
      correspondances.regionsApiSansCarte,
    );
    console.info(
      "Régions de la carte sans correspondance dans l’API :",
      correspondances.regionsCarteSansApi,
    );
  }, [donnees, geojson]);

  function styleRegion(feature) {
    const nom = feature.properties?.shapeName;
    const entree = valeurs.get(normaliserNom(nom));
    const sansValeur =
      !entree ||
      entree.valeur === null ||
      (!definition.categorique && !domaines);
    const selectionnee =
      normaliserNom(filtres.region) === normaliserNom(nom);

    return {
      fillColor: sansValeur
        ? appliquerPaletteTheme("#a8b3bd")
        : appliquerPaletteTheme(
            couleurSelonValeur(entree.valeur, domaines, variable),
          ),
      fillOpacity: 0.82,
      color: selectionnee
        ? appliquerPaletteTheme("#f5a623")
        : appliquerPaletteTheme("#ffffff"),
      weight: selectionnee ? 3 : 1,
    };
  }

  function lierRegion(feature, couche) {
    const nom = feature.properties?.shapeName ?? "Région";
    const cle = normaliserNom(nom);
    couche.bindTooltip(
      () => creerContenuInfobulle(feature, etatCarteRef.current),
      { sticky: true, direction: "top", className: "infobulle-carte" },
    );
    couche.on("click", () => {
      const nomApi = etatCarteRef.current.nomsRegionApi.get(cle);
      etatCarteRef.current.onFiltreRegion(nomApi ?? nom);
    });
    couche.on("add", () => {
      const element = couche.getElement();
      if (!element) {
        return;
      }

      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", `Région ${nom}, sélectionner`);
      element.addEventListener("focus", () => couche.openTooltip());
      element.addEventListener("blur", () => couche.closeTooltip());
      element.addEventListener("keydown", (evenement) => {
        if (evenement.key === "Enter" || evenement.key === " ") {
          evenement.preventDefault();
          const nomRegionApi = etatCarteRef.current.nomsRegionApi.get(cle);
          etatCarteRef.current.onFiltreRegion(nomRegionApi ?? nom);
        }
      });
    });
  }

  return (
    <article
      className="carte-graphique carte-senegal"
      data-theme-revision={revisionTheme}
    >
      <div className="entete-carte-graphique">
        <div>
          <h3>Carte agroclimatique</h3>
          <p className="description-carte">
            Comparez les régions selon la variable sélectionnée.
          </p>
        </div>
      </div>
      <div className="barre-outils-carte">
        <label className="selecteur-carte">
          Variable cartographique
          <select
            aria-label="Variable cartographique"
            value={variable}
            onChange={(evenement) => setVariable(evenement.target.value)}
          >
            {Object.entries(VARIABLES_CARTE).map(([cle, option]) => (
              <option key={cle} value={cle}>
                {option.libelle}
                {option.unite ? ` (${option.unite})` : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          className="bouton-secondaire"
          type="button"
          disabled={!geojson}
          onClick={() => {
            if (bornes && referenceCarte.current) {
              referenceCarte.current.fitBounds(bornes, {
                padding: [20, 20],
                maxZoom: 8,
              });
            }
          }}
        >
          Recentrer
        </button>
      </div>
      <div className="contenu-carte-senegal">
        {erreur ? (
          <p className="message-etat" role="alert">
            {erreur} Source des frontières : {SOURCE_GEOJSON}.
          </p>
        ) : geojson && bornes ? (
          <MapContainer
            className="carte-leaflet"
            bounds={bornes}
            boundsOptions={{ padding: [20, 20] }}
            maxBounds={bornes?.pad(0.1)}
            maxBoundsViscosity={1}
            scrollWheelZoom={false}
            maxZoom={10}
            aria-label={`Carte du Sénégal : ${definition.libelle} par région`}
          >
            <AjusterVue geojson={geojson} />
            <CapturerCarte referenceCarte={referenceCarte} />
            <AttributionGeoBoundaries />
            <GeoJSON
              data={geojson}
              style={styleRegion}
              onEachFeature={lierRegion}
            />
          </MapContainer>
        ) : (
          <p className="message-etat" role="status">
            Chargement des frontières régionales…
          </p>
        )}
        <aside className="profil-region" aria-live="polite">
          <p className="sur-titre">PROFIL DE ZONE</p>
          {filtres.region ? (
            <>
              <h4>{filtres.region}</h4>
              <p className="libelle-profil">{definition.libelle}</p>
              <strong className="valeur-profil">{valeurAffichee}</strong>
              {valeurRegionSelectionnee ? (
                <p className="details-profil">
                  {valeurRegionSelectionnee.lignesUtilisees}{" "}
                  {valeurRegionSelectionnee.lignesUtilisees === 1
                    ? "ligne utilisée"
                    : "lignes utilisées"}
                </p>
              ) : (
                <p className="details-profil">
                  Aucune valeur disponible pour cette région et cette sélection.
                </p>
              )}
              {valeurRegionSelectionnee &&
                !valeurRegionSelectionnee.climatDisponible && (
                  <p className="avis-profil" role="status">
                    Données climatiques indisponibles pour cette région.
                  </p>
                )}
            </>
          ) : (
            <p className="details-profil">
              Sélectionnez une région sur la carte pour afficher la valeur de{" "}
              {definition.libelle.toLowerCase()} correspondante.
            </p>
          )}
        </aside>
        <div
          className="legende-carte"
          role="group"
          aria-label={
            definition.categorique
              ? `Légende : ${definition.libelle}`
              : `Légende : ${definition.libelle} en ${definition.unite}`
          }
        >
          <span className="legende-titre">
            {definition.categorique
              ? `Niveaux — ${definition.libelle}`
              : `Échelle — ${definition.libelle} (${definition.unite})`}
          </span>
          {definition.categorique ? (
            <ul className="legende-categories">
              {legende.categories.map(([libelle, couleur]) => (
                <li key={libelle}>
                  <i
                    aria-hidden="true"
                    style={{
                      backgroundColor: appliquerPaletteTheme(couleur),
                    }}
                  />
                  {libelle}
                </li>
              ))}
            </ul>
          ) : domaines ? (
            <>
              <span className="legende-plage">
                Plage :{" "}
                {formaterValeur(legende.plage.min, definition.unite)} à{" "}
                {formaterValeur(legende.plage.max, definition.unite)}
              </span>
              <div
                className="legende-degrade"
                role="img"
                aria-label={`Dégradé, minimum ${formaterValeur(
                  legende.reperes[0],
                  definition.unite,
                )}${
                  legende.reperes.length === 3
                    ? `, zéro ${formaterValeur(0, definition.unite)}`
                    : ""
                }, maximum ${formaterValeur(
                  legende.reperes[legende.reperes.length - 1],
                  definition.unite,
                )}`}
                style={{ background: legende.gradient }}
              />
              <div className="legende-reperes">
                {legende.reperes.map((valeur, index) => (
                  <span key={`${valeur}-${index}`}>
                    <small>
                      {index === 0
                        ? "Min."
                        : index === legende.reperes.length - 1
                          ? "Max."
                          : "0"}
                    </small>
                    {formaterValeur(valeur, definition.unite)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <span className="legende-sans-donnee">
              Aucune valeur disponible
            </span>
          )}
          <span className="legende-sans-donnee">
            <i aria-hidden="true" /> Pas de données
          </span>
        </div>
      </div>
      <button
        className="bouton-secondaire bouton-tableau-carte"
        type="button"
        disabled={!geojson}
        aria-expanded={tableauVisible}
        aria-controls="tableau-valeurs-regions"
        onClick={() => setTableauVisible((visible) => !visible)}
      >
        {tableauVisible
          ? "Masquer les valeurs en tableau"
          : "Afficher les valeurs en tableau"}
      </button>
      <div
        className="tableau-carte-conteneur"
        id="tableau-valeurs-regions"
        hidden={!tableauVisible}
      >
        {tableauVisible && geojson && (
          <table className="tableau-carte">
            <caption>
              {definition.libelle} par région
              {definition.unite ? ` (${definition.unite})` : ""}
            </caption>
            <thead>
              <tr>
                <th scope="col">Région</th>
                <th scope="col">Valeur</th>
                <th scope="col">Lignes utilisées</th>
              </tr>
            </thead>
            <tbody>
              {geojson.features
                .map((feature) => {
                  const nom = feature.properties?.shapeName ?? "Région";
                  const entree = valeurs.get(normaliserNom(nom));
                  return {
                    nom,
                    entree,
                    valeur: entree?.valeur ?? null,
                  };
                })
                .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
                .map(({ nom, entree, valeur }) => (
                  <tr key={nom}>
                    <th scope="row">{nom}</th>
                    <td>
                      {definition.categorique
                        ? valeur ?? "Non évaluable"
                        : formaterValeur(valeur, definition.unite)}
                      {definition.categorique &&
                      entree &&
                      !entree.climatDisponible
                        ? " · climat indisponible"
                        : ""}
                    </td>
                    <td>{entree?.lignesUtilisees ?? 0}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="note-carte">
        Données : {definition.libelle}
        {definition.unite ? ` (${definition.unite})` : ""}
        {filtres.annee ? ` — année ${filtres.annee}` : ""}
        {filtres.produit ? ` — ${filtres.produit}` : ""}.
        {filtres.departement ? ` Département : ${filtres.departement}.` : ""}
      </p>
    </article>
  );
}
