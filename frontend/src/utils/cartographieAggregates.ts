/* =========================================================
   Agrégats de la page Cartographie, calculés côté client à
   partir des routes paginées /api/v1/agroclimat et /api/v1/climat.
   Règles :
   - rendement = Σ production / Σ superficie (campagnes ayant les
     deux valeurs), jamais une moyenne de rendements ;
   - null ≠ 0 : un null est ignoré, une somme sans aucune valeur
     renseignée reste null ;
   - pluie annuelle d'une station : uniquement si ses 12 mois sont
     renseignés (même règle que /api/v1/climat/annuel).
   ========================================================= */

import type { CampagneItem, ClimatItem } from "../services/dashboardApi";
import { getIndicateur, type Indicateur, type IndicateurId } from "../config/mapIndicators";
import { fmt, isNum, pctChange } from "./agroAggregates";
import { CLES_REGIONS, estRegionConnue, nomRegion, normaliserRegion, REGIONS_SANS_STATION } from "./regions";

export type CarteFiltres = {
    indicateur: IndicateurId;
    annee: number | null; // null : dernière année disponible pour l'indicateur
    produit: string | null;
    systeme: string | null;
};

/* ---------- Campagnes : région × année ---------- */

export type AccCampagnes = {
    nb: number;
    production: number; nbProduction: number;
    superficie: number; nbSuperficie: number;
    productionPaire: number; superficiePaire: number; nbPaire: number;
    avecClimat: number; climatRenseigne: number;
};

const accVide = (): AccCampagnes => ({
    nb: 0, production: 0, nbProduction: 0, superficie: 0, nbSuperficie: 0,
    productionPaire: 0, superficiePaire: 0, nbPaire: 0, avecClimat: 0, climatRenseigne: 0,
});

export type IndexRegionAnnee<T> = Map<string, Map<number, T>>;

const memeTexte = (a: string | null, b: string | null) =>
    b === null || (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();

const getOuCree = <T>(index: IndexRegionAnnee<T>, region: string, annee: number, init: () => T): T => {
    let parAnnee = index.get(region);
    if (!parAnnee) index.set(region, (parAnnee = new Map()));
    let acc = parAnnee.get(annee);
    if (!acc) parAnnee.set(annee, (acc = init()));
    return acc;
};

export function indexerCampagnes(rows: CampagneItem[], produit: string | null, systeme: string | null) {
    const index: IndexRegionAnnee<AccCampagnes> = new Map();
    const nonApparies = new Set<string>();

    for (const row of rows) {
        if (!isNum(row.annee) || !memeTexte(row.produit, produit) || !memeTexte(row.systeme_production, systeme)) continue;
        const cle = normaliserRegion(row.region);
        if (!estRegionConnue(cle)) {
            nonApparies.add(row.region ?? "(région nulle)");
            continue;
        }
        const acc = getOuCree(index, cle, row.annee, accVide);
        acc.nb += 1;
        if (isNum(row.production_t)) { acc.production += row.production_t; acc.nbProduction += 1; }
        if (isNum(row.superficie_ha)) { acc.superficie += row.superficie_ha; acc.nbSuperficie += 1; }
        if (isNum(row.production_t) && isNum(row.superficie_ha)) {
            acc.productionPaire += row.production_t;
            acc.superficiePaire += row.superficie_ha;
            acc.nbPaire += 1;
        }
        if (row.a_climat !== null) {
            acc.climatRenseigne += 1;
            if (row.a_climat) acc.avecClimat += 1;
        }
    }
    return { index, nonApparies };
}

/* ---------- Climat : région × année ---------- */

export type ClimatRegionAnnee = {
    pluie: number | null; nbStationsPluie: number;
    temperature: number | null; nbStationsTemperature: number;
};

export function indexerClimat(rows: ClimatItem[]) {
    // 1) station × année : cumul de pluie (mois distincts renseignés) et moyenne de température.
    type Station = { region: string; mois: Set<number>; pluie: number; tSomme: number; tN: number };
    const stations = new Map<string, Station>();
    const nonApparies = new Set<string>();

    for (const row of rows) {
        if (!row.station_key || !isNum(row.annee)) continue;
        const cle = normaliserRegion(row.region);
        if (!estRegionConnue(cle)) {
            nonApparies.add(row.region ?? "(région nulle)");
            continue;
        }
        const id = `${row.station_key}|${row.annee}`;
        let s = stations.get(id);
        if (!s) stations.set(id, (s = { region: cle, mois: new Set(), pluie: 0, tSomme: 0, tN: 0 }));
        if (isNum(row.prcp_mm) && isNum(row.mois) && !s.mois.has(row.mois)) { s.mois.add(row.mois); s.pluie += row.prcp_mm; }
        if (isNum(row.tavg)) { s.tSomme += row.tavg; s.tN += 1; }
    }

    // 2) région × année : moyenne sur les stations.
    type Acc = { pS: number; pN: number; tS: number; tN: number };
    const accs: IndexRegionAnnee<Acc> = new Map();
    for (const [id, s] of stations) {
        const annee = Number(id.slice(id.lastIndexOf("|") + 1));
        const acc = getOuCree(accs, s.region, annee, () => ({ pS: 0, pN: 0, tS: 0, tN: 0 }));
        if (s.mois.size === 12) { acc.pS += s.pluie; acc.pN += 1; }
        if (s.tN > 0) { acc.tS += s.tSomme / s.tN; acc.tN += 1; }
    }

    const index: IndexRegionAnnee<ClimatRegionAnnee> = new Map();
    const normalePluie = new Map<string, number>();
    for (const [region, parAnnee] of accs) {
        const out = new Map<number, ClimatRegionAnnee>();
        const pluies: number[] = [];
        for (const [annee, a] of parAnnee) {
            const pluie = a.pN ? a.pS / a.pN : null;
            if (pluie !== null) pluies.push(pluie);
            out.set(annee, { pluie, nbStationsPluie: a.pN, temperature: a.tN ? a.tS / a.tN : null, nbStationsTemperature: a.tN });
        }
        index.set(region, out);
        if (pluies.length) normalePluie.set(region, pluies.reduce((x, y) => x + y, 0) / pluies.length);
    }
    return { index, normalePluie, nonApparies };
}

/* ---------- Valeur d'un indicateur ---------- */

export type SourcesCarte = {
    campagnes: IndexRegionAnnee<AccCampagnes> | null;
    climat: IndexRegionAnnee<ClimatRegionAnnee> | null;
    normalePluie: Map<string, number> | null;
};

export function valeurIndicateur(id: IndicateurId, sources: SourcesCarte, region: string, annee: number): number | null {
    const c = sources.campagnes?.get(region)?.get(annee);
    const k = sources.climat?.get(region)?.get(annee);
    switch (id) {
        case "production": return c && c.nbProduction ? c.production : null;
        case "superficie": return c && c.nbSuperficie ? c.superficie : null;
        case "rendement": return c && c.nbPaire && c.superficiePaire > 0 ? c.productionPaire / c.superficiePaire : null;
        case "pluie": return k?.pluie ?? null;
        case "temperature": return k?.temperature ?? null;
        case "anomalie_pluie": {
            const normale = sources.normalePluie?.get(region);
            return isNum(k?.pluie) && isNum(normale) ? k.pluie - normale : null;
        }
        default: return null; // indicateurs non encore alimentés par l'API
    }
}

export function evolution(indicateur: Indicateur, valeur: number | null, precedente: number | null): number | null {
    if (indicateur.evolution === "pct") return pctChange(valeur, precedente);
    return isNum(valeur) && isNum(precedente) ? valeur - precedente : null;
}

/** Années où au moins une région a une valeur pour l'indicateur, de la plus récente à la plus ancienne. */
export function anneesAvecDonnees(id: IndicateurId, sources: SourcesCarte): number[] {
    const annees = new Set<number>();
    for (const region of CLES_REGIONS) {
        const candidates = getIndicateur(id).famille === "climat" ? sources.climat?.get(region) : sources.campagnes?.get(region);
        for (const annee of candidates?.keys() ?? []) {
            if (valeurIndicateur(id, sources, region, annee) !== null) annees.add(annee);
        }
    }
    return [...annees].sort((a, b) => b - a);
}

/* ---------- Statistiques par région ---------- */

export type RegionStat = {
    cle: string;
    nom: string;
    valeur: number | null;
    valeurN1: number | null;
    evolution: number | null;
    nbCampagnes: number;
    couvertureClimatPct: number | null;
    sansStation: boolean;
};

export function statsRegions(id: IndicateurId, sources: SourcesCarte, annee: number): Map<string, RegionStat> {
    const indicateur = getIndicateur(id);
    return new Map(CLES_REGIONS.map((cle) => {
        const valeur = valeurIndicateur(id, sources, cle, annee);
        const valeurN1 = valeurIndicateur(id, sources, cle, annee - 1);
        const c = sources.campagnes?.get(cle)?.get(annee);
        return [cle, {
            cle,
            nom: nomRegion(cle),
            valeur,
            valeurN1,
            evolution: evolution(indicateur, valeur, valeurN1),
            nbCampagnes: c?.nb ?? 0,
            couvertureClimatPct: c && c.climatRenseigne ? (c.avecClimat / c.climatRenseigne) * 100 : null,
            sansStation: REGIONS_SANS_STATION.has(cle),
        }];
    }));
}

/** Part des campagnes (année + filtres) disposant de données climatiques, toutes régions confondues. */
export function couvertureClimat(sources: SourcesCarte, annee: number): number | null {
    let avec = 0;
    let renseigne = 0;
    for (const parAnnee of sources.campagnes?.values() ?? []) {
        const c = parAnnee.get(annee);
        if (c) { avec += c.avecClimat; renseigne += c.climatRenseigne; }
    }
    return renseigne ? (avec / renseigne) * 100 : null;
}

/* ---------- Échelle de couleur ---------- */

export type Classe = { min: number; max: number; couleur: string };
export type Echelle = { classes: Classe[]; couleur: (v: number | null) => string | null };

/** 5 classes d'amplitude égale ; divergente : symétrique autour de 0, classe centrale neutre. */
export function construireEchelle(indicateur: Indicateur, valeurs: (number | null)[]): Echelle {
    const nums = valeurs.filter(isNum);
    if (!nums.length) return { classes: [], couleur: () => null };

    const n = indicateur.palette.length;
    let min = Math.min(...nums);
    let max = Math.max(...nums);
    if (indicateur.echelle === "divergente") {
        const m = Math.max(Math.abs(min), Math.abs(max)) || 1;
        min = -m;
        max = m;
    }
    if (min === max) {
        const classe = { min, max, couleur: indicateur.palette[n - 1] };
        return { classes: [classe], couleur: (v) => (isNum(v) ? classe.couleur : null) };
    }

    const pas = (max - min) / n;
    const classes = indicateur.palette.map((couleur, i) => ({ min: min + i * pas, max: i === n - 1 ? max : min + (i + 1) * pas, couleur }));
    const couleur = (v: number | null) => {
        if (!isNum(v)) return null;
        const i = Math.min(n - 1, Math.max(0, Math.floor((v - min) / pas)));
        return classes[i].couleur;
    };
    return { classes, couleur };
}

/* ---------- Formatage ---------- */

export function formatValeur(indicateur: Indicateur, v: number | null | undefined, signe = indicateur.echelle === "divergente"): string {
    if (!isNum(v)) return "—";
    const texte = indicateur.decimales === 0 ? fmt.int(v) : indicateur.decimales === 1 ? fmt.dec1(v) : fmt.dec2(v);
    return `${signe && v > 0 ? "+" : ""}${texte}${indicateur.unite ? ` ${indicateur.unite}` : ""}`;
}

export function formatEvolution(indicateur: Indicateur, v: number | null): string {
    if (!isNum(v)) return "—";
    return indicateur.evolution === "pct" ? fmt.pct(v, true) : formatValeur(indicateur, v, true);
}
