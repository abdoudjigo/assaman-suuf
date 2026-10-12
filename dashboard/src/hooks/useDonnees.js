import { useCallback, useEffect, useState } from "react";
import { chargerDonnees } from "../api/client.js";

// Gère le cycle de chargement, sa progression, les erreurs et la réessai.
export default function useDonnees() {
  const [donnees, setDonnees] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [progression, setProgression] = useState({
    pagesChargees: 0,
    total: 0,
  });
  const [tentative, setTentative] = useState(0);

  const reessayer = useCallback(() => {
    setTentative((valeur) => valeur + 1);
  }, []);

  useEffect(() => {
    const controleur = new AbortController();

    setChargement(true);
    setErreur(null);
    setProgression({ pagesChargees: 0, total: 0 });

    chargerDonnees(controleur.signal, (pagesChargees, total) => {
      setProgression({ pagesChargees, total });
    })
      .then((lignes) => {
        setDonnees(lignes);
        setChargement(false);
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setErreur(cause);
          setChargement(false);
        }
      });

    return () => controleur.abort();
  }, [tentative]);

  return { donnees, chargement, erreur, progression, reessayer };
}
