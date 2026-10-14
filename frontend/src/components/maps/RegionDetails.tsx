import { CloudRain, X } from "lucide-react";
import type { Cartographie } from "../../hooks/useCartographieData";
import { formatEvolution, formatValeur } from "../../utils/cartographieAggregates";
import { fmt, isNum } from "../../utils/agroAggregates";
import { nomRegion, REGIONS_SANS_STATION } from "../../utils/regions";

/* Fiche d'une région cliquée : valeurs de l'année, évolution vs N-1, campagnes, stations. */
export default function RegionDetails({ cle, carto, onClose }: { cle: string; carto: Cartographie; onClose: () => void }) {
    const { annee, indicateur: actif, statut } = carto;
    const stat = carto.regions?.get(cle);
    const lignes = carto.detailRegion(cle);
    const stations = carto.stationsParRegion.get(cle) ?? [];
    const sansStation = REGIONS_SANS_STATION.has(cle);

    return (
        <aside className="absolute right-4 top-24 z-20 flex max-h-[calc(100%-13rem)] w-[min(330px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl md:right-6">
            <header className="flex items-center justify-between border-b border-slate-100 p-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Région · {annee ?? "—"}</p>
                    <h2 className="text-sm font-bold">{nomRegion(cle)}</h2>
                </div>
                <button type="button" onClick={onClose} aria-label="Fermer la fiche" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={16}/></button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {statut.kind === "loading" && <div role="status" className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100"/>)}</div>}

                {statut.kind !== "loading" && (
                    <>
                        <div className="mb-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] uppercase tracking-wide text-slate-400">Campagnes</p><p className="mt-1 text-sm font-bold tabular-nums">{fmt.int(stat?.nbCampagnes ?? 0)}</p></div>
                            <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] uppercase tracking-wide text-slate-400">Couverture climat</p><p className="mt-1 text-sm font-bold tabular-nums">{fmt.pct(stat?.couvertureClimatPct)}</p></div>
                        </div>

                        <table className="w-full text-left text-[11px]">
                            <caption className="sr-only">Indicateurs de {nomRegion(cle)} en {annee}, évolution par rapport à {annee !== null ? annee - 1 : "N-1"}</caption>
                            <thead><tr className="text-[9px] uppercase tracking-wide text-slate-400"><th className="py-1 font-medium">Indicateur</th><th className="py-1 text-right font-medium">{annee}</th><th className="py-1 text-right font-medium">vs N-1</th></tr></thead>
                            <tbody>
                                {lignes.map(({ indicateur, valeur, evolution }) => (
                                    <tr key={indicateur.id} className={`border-t border-slate-100 ${indicateur.id === actif.id ? "bg-green-50/70 font-semibold" : ""}`}>
                                        <td className="py-1.5 pr-2 text-slate-700">{indicateur.label}</td>
                                        {valeur === null
                                            ? <td colSpan={2} className="py-1.5 text-right text-slate-400">Donnée non disponible</td>
                                            : <>
                                                <td className="py-1.5 text-right tabular-nums text-slate-900">{formatValeur(indicateur, valeur)}</td>
                                                <td className={`py-1.5 pl-2 text-right tabular-nums ${isNum(evolution) ? "text-slate-700" : "text-slate-400"}`}>{formatEvolution(indicateur, evolution)}</td>
                                            </>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {statut.kind === "error" && <p className="mt-2 text-[10px] text-red-700">{statut.message}</p>}
                    </>
                )}

                <section className="mt-4">
                    <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><CloudRain size={13}/> Stations climatiques</h3>
                    {carto.statutStations.kind === "loading" && <div className="h-8 animate-pulse rounded-lg bg-slate-100"/>}
                    {carto.statutStations.kind === "error" && <p className="text-[11px] text-red-700">{carto.statutStations.message}</p>}
                    {carto.statutStations.kind === "ready" && (stations.length
                        ? <ul className="flex flex-wrap gap-1.5">{stations.map((s) => <li key={s.station_key ?? s.station} className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] text-sky-800">{s.station_nom ?? s.station}</li>)}</ul>
                        : <p className="text-[11px] text-slate-500">{sansStation ? "Aucune station dans cette région : les indicateurs climatiques ne sont pas disponibles (situation normale)." : "Aucune station rattachée à cette région."}</p>)}
                </section>
            </div>
        </aside>
    );
}
