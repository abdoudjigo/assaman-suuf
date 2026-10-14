import { CircleAlert, RefreshCw, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import type { Cartographie } from "../../hooks/useCartographieData";
import { formatValeur } from "../../utils/cartographieAggregates";
import { fmt } from "../../utils/agroAggregates";
import { STYLE_HACHURES } from "../../config/mapIndicators";

/* Légende de la choroplèthe : classes + unités, « Pas de donnée », états chargement / erreur / vide. */
export default function MapLegend({ carto, onEdit, footer }: { carto: Cartographie; onEdit: () => void; footer?: ReactNode }) {
    const { indicateur, annee, echelle, statut, couverture, nonApparies } = carto;

    return (
        <section aria-label="Légende de la carte" className="w-[min(260px,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur">
            <header className="mb-2 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{indicateur.label}{indicateur.unite && <span className="font-normal text-slate-500"> ({indicateur.unite})</span>}</p>
                    <p className="text-[10px] text-slate-500">{annee !== null ? `Année ${annee}` : "Aucune année disponible"}</p>
                </div>
                <button type="button" onClick={onEdit} title="Changer d'indicateur ou de filtres" aria-label="Changer d'indicateur ou de filtres" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><SlidersHorizontal size={14}/></button>
            </header>

            {statut.kind === "loading" && (
                <div role="status" aria-label="Chargement des données" className="space-y-1.5">
                    {Array.from({ length: 5 }, (_, i) => <div key={i} className="flex items-center gap-2"><span className="h-3 w-5 animate-pulse rounded bg-slate-200"/><span className="h-2.5 flex-1 animate-pulse rounded bg-slate-100"/></div>)}
                    <p className="pt-1 text-[10px] text-slate-400">Chargement de toutes les pages de l'API…</p>
                </div>
            )}

            {statut.kind === "error" && (
                <div role="alert" className="flex flex-col items-start gap-2 rounded-xl bg-red-50 p-2.5">
                    <p className="flex gap-1.5 text-[11px] leading-4 text-red-800"><CircleAlert size={14} className="mt-0.5 shrink-0"/>{statut.message}</p>
                    {statut.onRetry && <button type="button" onClick={statut.onRetry} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"><RefreshCw size={12}/> Réessayer</button>}
                </div>
            )}

            {statut.kind === "empty" && <p className="mb-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-4 text-slate-500">{statut.message}</p>}

            {(statut.kind === "ready" || statut.kind === "empty") && (
                <ul className="space-y-1">
                    {[...echelle.classes].reverse().map((classe) => (
                        <li key={classe.couleur} className="flex items-center gap-2 text-[11px] text-slate-700">
                            <span className="h-3 w-5 shrink-0 rounded-sm border border-black/5" style={{ backgroundColor: classe.couleur }}/>
                            <span className="tabular-nums">{formatValeur(indicateur, classe.min)} – {formatValeur(indicateur, classe.max)}</span>
                        </li>
                    ))}
                    <li className="flex items-center gap-2 text-[11px] text-slate-700">
                        <span className="h-3 w-5 shrink-0 rounded-sm border border-slate-300" style={STYLE_HACHURES}/>
                        <span>Pas de donnée</span>
                    </li>
                </ul>
            )}

            {indicateur.famille === "climat" && statut.kind !== "loading" && (
                <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-4 text-slate-500">
                    Couverture climatique des campagnes : <strong className="text-slate-700">{fmt.pct(couverture)}</strong>. Fatick, Kaffrine et Sédhiou n'ont pas de station : pas de donnée climatique.
                </p>
            )}

            {nonApparies.length > 0 && (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-800" title={nonApparies.join(", ")}>
                    {nonApparies.length} nom(s) de région de l'API non apparié(s) à la carte : {nonApparies.slice(0, 3).join(", ")}{nonApparies.length > 3 ? "…" : ""}
                </p>
            )}

            {footer && <div className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500">{footer}</div>}
        </section>
    );
}
