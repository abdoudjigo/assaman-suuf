import { API_URL, TAILLE_PAGE, UTILISER_API } from "../config.js";

const PAGES_EN_PARALLELE = 5;

// Vérifie le format commun aux réponses de l'API et au fichier local.
function lireLignes(reponse) {
  if (!reponse || !Array.isArray(reponse.data)) {
    throw new Error("Le format des données reçu est invalide.");
  }

  return reponse.data;
}

// Lit une page et signale clairement toute erreur HTTP ou de format JSON.
async function lirePage(url, signal) {
  let reponse;

  try {
    reponse = await fetch(url, { signal });
  } catch (cause) {
    if (cause && cause.name === "AbortError") {
      throw cause;
    }

    const source = url.startsWith("http")
      ? "l’API configurée"
      : "le fichier public/donnees.json";
    throw new Error(
      `Connexion impossible à ${source}. Vérifiez le réseau et la disponibilité de la source.`,
      { cause },
    );
  }

  if (!reponse.ok) {
    throw new Error(`Erreur HTTP ${reponse.status} lors du chargement des données.`);
  }

  try {
    return await reponse.json();
  } catch {
    throw new Error("La réponse reçue n'est pas un JSON valide.");
  }
}

// Charge le fichier de secours local, qui suit le format de l'API.
async function lireFichierLocal(signal, onProgression) {
  const reponse = await lirePage("/donnees.json", signal);
  onProgression(1, 1);
  return lireLignes(reponse);
}

// Parcourt toutes les pages API, car les filtres seront faits dans le navigateur.
async function lireToutesLesPages(signal, onProgression) {
  const premierePage = await lirePage(
    `${API_URL}/api/v1/agroclimat?page=1&page_size=${TAILLE_PAGE}`,
    signal,
  );
  const pagination = premierePage.pagination;

  if (!pagination || !Number.isInteger(pagination.total_pages) || pagination.total_pages < 0) {
    throw new Error("Les informations de pagination de l'API sont invalides.");
  }

  const totalPages = Math.max(1, pagination.total_pages);
  const lignes = lireLignes(premierePage);
  let pagesChargees = 1;
  onProgression(pagesChargees, totalPages);

  // Charge quelques pages à la fois pour réduire l'attente sans saturer l'API.
  for (
    let debutLot = 2;
    debutLot <= totalPages;
    debutLot += PAGES_EN_PARALLELE
  ) {
    const numerosPages = Array.from(
      { length: Math.min(PAGES_EN_PARALLELE, totalPages - debutLot + 1) },
      (_, index) => debutLot + index,
    );
    const resultats = await Promise.allSettled(
      numerosPages.map(async (page) => {
        const reponse = await lirePage(
          `${API_URL}/api/v1/agroclimat?page=${page}&page_size=${TAILLE_PAGE}`,
          signal,
        );
        const pageLignes = lireLignes(reponse);
        pagesChargees += 1;
        onProgression(pagesChargees, totalPages);
        return pageLignes;
      }),
    );
    const pages = [];
    for (const resultat of resultats) {
      if (resultat.status === "rejected") {
        throw resultat.reason;
      }
      pages.push(resultat.value);
    }
    pages.forEach((pageLignes) => lignes.push(...pageLignes));
  }

  return lignes;
}

// Choisit la source configurée et publie l'avancement pour l'interface.
export function chargerDonnees(signal, onProgression = () => {}) {
  return UTILISER_API
    ? lireToutesLesPages(signal, onProgression)
    : lireFichierLocal(signal, onProgression);
}
