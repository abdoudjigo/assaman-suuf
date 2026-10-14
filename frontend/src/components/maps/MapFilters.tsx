import { Check } from "lucide-react";
import { FAMILLES, INDICATEURS, type Famille, type IndicateurId } from "../../config/mapIndicators";
import type { Cartographie } from "../../hooks/useCartographieData";
import type { CarteFiltres } from "../../utils/cartographieAggregates";
import { FilterSelect } from "../dashboard/DashboardBlocks";

/* Sélecteurs de la Cartographie : indicateur (les non disponibles sont visibles mais désactivés), année, culture, système. */

export function IndicatorPicker({ value, onChange }: { value: IndicateurId; onChange: (id: IndicateurId) => void }) {
    return (
        <div className="space-y-3" role="radiogroup" aria-label="Indicateur affiché">
            {(Object.keys(FAMILLES) as Famille[]).map((famille) => (
                <section key={famille}>
                    <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{FAMILLES[famille]}</h3>
                    <div className="space-y-1">
                        {INDICATEURS.filter((i) => i.famille === famille).map((i) => {
                            const actif = i.id === value;
                            return (
                                <button
                                    key={i.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={actif}
                                    disabled={!i.disponible}
                                    onClick={() => onChange(i.id)}
                                    title={i.description}
                                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${actif ? "border-green-500 bg-green-50" : "border-slate-200 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:opacity-60`}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className={`block text-xs font-semibold ${i.disponible ? "text-slate-800" : "text-slate-400"}`}>
                                            {i.label}{i.unite && <span className="font-normal text-slate-400"> · {i.unite}</span>}
                                        </span>
                                        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{i.description}</span>
                                    </span>
                                    {!i.disponible && <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-500">Bientôt disponible</span>}
                                    {actif && <Check size={15} className="shrink-0 text-green-700"/>}
                                </button>
                            );
                        })}
                    </div>
                </section>
            ))}
        </div>
    );
}

export default function MapFilters({ filtres, onChange, carto }: { filtres: CarteFiltres; onChange: (filtres: CarteFiltres) => void; carto: Cartographie }) {
    const set = <K extends keyof CarteFiltres>(key: K, value: CarteFiltres[K]) => onChange({ ...filtres, [key]: value });
    const climatique = carto.indicateur.famille === "climat";
    const chargement = carto.statut.kind === "loading";

    return (
        <div className="space-y-5">
            <IndicatorPicker value={filtres.indicateur} onChange={(id) => onChange({ ...filtres, indicateur: id, annee: null })}/>

            <div className="grid gap-3">
                <FilterSelect label="Année" value={filtres.annee} options={carto.options.annees} allLabel={`Dernière disponible${carto.annee !== null && filtres.annee === null ? ` (${carto.annee})` : ""}`} onChange={(v) => set("annee", v)} disabled={chargement}/>
                <FilterSelect label="Culture" value={filtres.produit} options={carto.options.produits} allLabel="Toutes" onChange={(v) => set("produit", v)} disabled={chargement || climatique}/>
                <FilterSelect label="Système de production" value={filtres.systeme} options={carto.options.systemes} allLabel="Tous" onChange={(v) => set("systeme", v)} disabled={chargement || climatique}/>
                {climatique && <p className="text-[10px] leading-4 text-slate-500">Les indicateurs climatiques viennent des stations : la culture et le système de production ne s'y appliquent pas.</p>}
                {filtres.annee !== null && !carto.anneesIndicateur.includes(filtres.annee) && !chargement && (
                    <p className="rounded-lg bg-slate-50 p-2 text-[10px] leading-4 text-slate-500">Aucune donnée « {carto.indicateur.label} » en {filtres.annee} : les régions sont grisées.</p>
                )}
            </div>
        </div>
    );
}
