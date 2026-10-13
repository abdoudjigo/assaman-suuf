const COULEURS_LEGACY = {
  "#1c8fd0": "--principal",
  "#f5a623": "--soleil",
  "#3fa34d": "--vert",
  "#e0382b": "--alerte",
  "#55b9e6": "--bleu-clair",
  "#a8b3bd": "--sans-donnee",
  "#e8f5e9": "--fond-vert",
  "#ffffff": "--carte",
};

const DEGRADES_LEGACY = [
  ["#ffffff", "#e0382b", "--carte", "--alerte"],
  ["#ffffff", "#1c8fd0", "--carte", "--principal"],
  ["#e8f5e9", "#3fa34d", "--fond-vert", "--vert"],
];

function canauxHex(couleur) {
  return couleur
    .slice(1)
    .match(/.{2}/g)
    .map((canal) => Number.parseInt(canal, 16));
}

function interpolerCouleur(couleurDepart, couleurArrivee, proportion) {
  const depart = canauxHex(couleurDepart);
  const arrivee = canauxHex(couleurArrivee);
  const canaux = depart.map((canal, index) =>
    Math.round(canal + (arrivee[index] - canal) * proportion),
  );
  return `#${canaux.map((canal) => canal.toString(16).padStart(2, "0")).join("")}`;
}

function adapterCouleurDegrade(couleur) {
  const canaux = canauxHex(couleur);
  let meilleurDegrade = null;

  DEGRADES_LEGACY.forEach(
    ([depart, arrivee, variableDepart, variableArrivee]) => {
      const debut = canauxHex(depart);
      const fin = canauxHex(arrivee);
      const delta = debut.map((canal, index) => fin[index] - canal);
      const longueur = delta.reduce((somme, canal) => somme + canal ** 2, 0);
      const proportion = Math.max(
        0,
        Math.min(
          1,
          canaux.reduce(
            (somme, canal, index) =>
              somme + (canal - debut[index]) * delta[index],
            0,
          ) / longueur,
        ),
      );
      const ecart = canaux.reduce(
        (somme, canal, index) =>
          somme + (canal - debut[index] - delta[index] * proportion) ** 2,
        0,
      );

      if (!meilleurDegrade || ecart < meilleurDegrade.ecart) {
        meilleurDegrade = {
          ecart,
          proportion,
          variableDepart,
          variableArrivee,
        };
      }
    },
  );

  if (meilleurDegrade.ecart > 3) {
    return couleur;
  }

  const styles = getComputedStyle(document.documentElement);
  const depart = styles
    .getPropertyValue(meilleurDegrade.variableDepart)
    .trim();
  const arrivee = styles
    .getPropertyValue(meilleurDegrade.variableArrivee)
    .trim();

  if (!/^#[\da-f]{6}$/i.test(depart) || !/^#[\da-f]{6}$/i.test(arrivee)) {
    return couleur;
  }

  return interpolerCouleur(depart, arrivee, meilleurDegrade.proportion);
}

// Remplace les anciennes couleurs de visualisation par la palette CSS active.
export function appliquerPaletteTheme(valeur) {
  if (Array.isArray(valeur)) {
    return valeur.map(appliquerPaletteTheme);
  }

  if (typeof valeur !== "string") {
    return valeur;
  }

  let resultat = valeur.replace(/#[\da-f]{6}/gi, adapterCouleurDegrade);
  Object.entries(COULEURS_LEGACY).forEach(([ancienneCouleur, variable]) => {
    const couleur = getComputedStyle(document.documentElement)
      .getPropertyValue(variable)
      .trim();
    if (couleur) {
      resultat = resultat.replaceAll(ancienneCouleur, couleur);
    }
  });

  const vert = getComputedStyle(document.documentElement)
    .getPropertyValue("--vert")
    .trim();
  if (/^#[\da-f]{6}$/i.test(vert)) {
    const [rouge, vertCanal, bleu] = canauxHex(vert);
    resultat = resultat.replace(
      /rgba\(63,\s*163,\s*77,\s*([\d.]+)\)/gi,
      `rgba(${rouge}, ${vertCanal}, ${bleu}, $1)`,
    );
  }

  return resultat;
}
