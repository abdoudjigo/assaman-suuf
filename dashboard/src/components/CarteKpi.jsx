import { useEffect, useRef, useState } from "react";

// Affiche un indicateur lisible, en distinguant une absence de valeur du zéro.
export default function CarteKpi({
  titre,
  valeur,
  unite,
  couleur,
  animerValeur = true,
}) {
  const [valeurAnimee, setValeurAnimee] = useState(null);
  const derniereValeur = useRef(0);

  // Anime les changements de nombre, sauf si le système réduit les mouvements.
  useEffect(() => {
    if (valeur === null || valeur === undefined) {
      setValeurAnimee(null);
      derniereValeur.current = 0;
      return undefined;
    }

    const valeurDepart = derniereValeur.current;
    if (
      !animerValeur ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValeurAnimee(valeur);
      derniereValeur.current = valeur;
      return undefined;
    }

    let animation;
    let debut = null;
    const duree = 300;
    const animerFrame = (instant) => {
      if (debut === null) {
        debut = instant;
      }

      const progression = Math.min((instant - debut) / duree, 1);
      const lissage = 1 - (1 - progression) ** 3;
      setValeurAnimee(valeurDepart + (valeur - valeurDepart) * lissage);

      if (progression < 1) {
        animation = window.requestAnimationFrame(animerFrame);
      } else {
        derniereValeur.current = valeur;
      }
    };

    animation = window.requestAnimationFrame(animerFrame);
    return () => window.cancelAnimationFrame(animation);
  }, [animerValeur, valeur]);

  const valeurFormatee =
    valeurAnimee === null || valeurAnimee === undefined
      ? "–"
      : valeurAnimee.toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
        });

  return (
    <article
      className="carte-kpi"
      style={couleur ? { "--couleur-kpi": couleur } : undefined}
    >
      <span className="libelle-kpi">
        {titre}
      </span>
      <strong>
        {valeurFormatee}
        {unite && <small className="unite-kpi">{unite}</small>}
      </strong>
    </article>
  );
}
