// Reconnaît les nombres réellement présents sans convertir null en zéro.
function estNombre(valeur) {
  return typeof valeur === "number" && Number.isFinite(valeur);
}

// Additionne uniquement les valeurs numériques connues.
export function somme(lignes, champ) {
  const valeurs = lignes.map((ligne) => ligne[champ]).filter(estNombre);
  return valeurs.length
    ? valeurs.reduce((total, valeur) => total + valeur, 0)
    : null;
}

// Calcule une moyenne en ignorant explicitement les valeurs absentes.
export function moyenne(lignes, champ) {
  const valeurs = lignes.map((ligne) => ligne[champ]).filter(estNombre);
  return valeurs.length
    ? valeurs.reduce((total, valeur) => total + valeur, 0) / valeurs.length
    : null;
}

// Compte les mesures réellement présentes pour décrire les agrégations.
export function compterValeurs(lignes, champ) {
  return lignes.reduce(
    (compte, ligne) => compte + (estNombre(ligne[champ]) ? 1 : 0),
    0,
  );
}

// Compte les lignes agricoles qui participent au calcul du rendement agrégé.
export function compterLignesRendement(lignes) {
  return lignes.reduce(
    (compte, ligne) =>
      compte +
      (estNombre(ligne.production_t) &&
      estNombre(ligne.superficie_ha) &&
      ligne.superficie_ha !== 0
        ? 1
        : 0),
    0,
  );
}

// Calcule le rendement agrégé uniquement sur les lignes complètes.
export function rendement(lignes) {
  const lignesCompletes = lignes.filter(
    (ligne) =>
      estNombre(ligne.production_t) &&
      estNombre(ligne.superficie_ha) &&
      ligne.superficie_ha !== 0,
  );

  if (!lignesCompletes.length) {
    return null;
  }

  const production = somme(lignesCompletes, "production_t");
  const superficie = somme(lignesCompletes, "superficie_ha");
  return superficie ? production / superficie : null;
}

// Déduplique les lignes climatiques à l'échelle région-année.
export function climatUnique(lignes) {
  const clesVues = new Set();

  return lignes.filter((ligne) => {
    if (!ligne.a_climat) {
      return false;
    }

    const cle = JSON.stringify([ligne.region, ligne.annee]);
    if (clesVues.has(cle)) {
      return false;
    }

    clesVues.add(cle);
    return true;
  });
}

// Calcule une moyenne climatique sans surpondérer les régions-années répétées.
export function moyenneClimat(lignes, champ) {
  return moyenne(climatUnique(lignes), champ);
}

// Regroupe les lignes par valeur de champ sans dépendre de l'ordre du jeu.
export function grouper(lignes, champ) {
  return lignes.reduce((groupes, ligne) => {
    const cle = ligne[champ];
    if (!Object.hasOwn(groupes, cle)) {
      groupes[cle] = [];
    }
    groupes[cle].push(ligne);
    return groupes;
  }, Object.create(null));
}

// Retourne les valeurs distinctes disponibles, triées pour les listes de filtres.
export function valeursUniques(lignes, champ) {
  const valeurs = new Set(
    lignes
      .map((ligne) => ligne[champ])
      .filter((valeur) => valeur !== null && valeur !== undefined),
  );

  return [...valeurs].sort((a, b) =>
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "fr"),
  );
}

// Calcule le coefficient de Pearson sur les paires numériques disponibles.
export function correlation(x, y) {
  const paires = [];
  const longueur = Math.min(x.length, y.length);

  for (let index = 0; index < longueur; index += 1) {
    if (estNombre(x[index]) && estNombre(y[index])) {
      paires.push([x[index], y[index]]);
    }
  }

  if (paires.length < 2) {
    return null;
  }

  const moyenneX = paires.reduce((total, paire) => total + paire[0], 0) / paires.length;
  const moyenneY = paires.reduce((total, paire) => total + paire[1], 0) / paires.length;
  let sommeXY = 0;
  let sommeXX = 0;
  let sommeYY = 0;

  paires.forEach(([valeurX, valeurY]) => {
    sommeXY += (valeurX - moyenneX) * (valeurY - moyenneY);
    sommeXX += (valeurX - moyenneX) ** 2;
    sommeYY += (valeurY - moyenneY) ** 2;
  });

  return sommeXX && sommeYY ? sommeXY / Math.sqrt(sommeXX * sommeYY) : null;
}

// Applique les critères communs et peut ignorer l'année pour les séries temporelles.
export function filtrerLignes(lignes, filtres, ignorerAnnee = false) {
  return lignes.filter(
    (ligne) =>
      (ignorerAnnee || !filtres.annee || String(ligne.annee) === filtres.annee) &&
      (!filtres.region || ligne.region === filtres.region) &&
      (!filtres.departement || ligne.departement === filtres.departement) &&
      (!filtres.produit || ligne.produit === filtres.produit),
  );
}
