import { AlertTriangle, Droplets, Sprout, Thermometer, TrendingUp, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useZoneSummary, type ZoneSummary } from "./useZoneData";

const MONTHS = "JFMAMJJASOND";
const LEVEL = {
    low: "bg-green-50 text-green-700",
    medium: "bg-orange-50 text-orange-700",
    high: "bg-red-50 text-red-700",
};

function Kpi({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-1.5 text-slate-400">
                <Icon size={12} />
                <p className="text-[9px] uppercase tracking-wide">{label}</p>
            </div>
            <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
        </div>
    );
}

function Title({ children }: { children: React.ReactNode }) {
    return <h3 className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{children}</h3>;
}

function recommendations(s: ZoneSummary) {
    const { drought, rainfall } = s.kpis;
    const out: string[] = [];
    if (drought >= 60) out.push("Variétés à cycle court (90 jours ou moins) et semis fractionné après la première pluie utile.");
    else if (drought < 30) out.push("Conditions favorables : semis précoce et intensification (semences certifiées, engrais).");
    else out.push("Suivre les cumuls pluviométriques décadaires avant de semer.");
    if (rainfall >= 900) out.push("Pluies abondantes : drainer les parcelles basses, surveiller les maladies fongiques.");
    if (rainfall < 400) out.push("Pluies limitées : paillage, demi-lunes ou irrigation d'appoint.");
    const weak = s.crops.filter((c) => c.yield < c.national * 0.85);
    if (weak.length) out.push(`Rendement sous la moyenne nationale : ${weak.map((c) => c.name).join(", ")}.`);
    out.push(`Fenêtre de semis indicative : ${rainfall >= 900 ? "1er au 30 juin" : rainfall >= 500 ? "15 juin au 15 juillet" : "1er au 31 juillet"}.`);
    return out;
}

export default function ZoneDashboard({ zone, onClose }: { zone: string; onClose: () => void }) {
    const s = useZoneSummary(zone);

    return (
        <aside className="absolute bottom-24 right-4 top-20 z-30 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Zone sélectionnée</p>
                    <h2 className="text-lg font-bold text-slate-900">{zone}</h2>
                    {s && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className={`h-1.5 w-1.5 rounded-full ${s.source === "api" ? "animate-pulse bg-green-500" : "bg-orange-400"}`} />
                            {s.source === "api" ? "Direct" : "Données de démonstration"} · {new Date(s.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    )}
                </div>
                <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                    <X size={17} />
                </button>
            </div>

            {!s ? (
                <p className="p-4 text-xs text-slate-400">Chargement des indicateurs…</p>
            ) : (
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Kpi icon={Droplets} label="Précipitations" value={`${s.kpis.rainfall} mm`} />
                        <Kpi icon={Thermometer} label="Température" value={`${s.kpis.temperature} °C`} />
                        <Kpi icon={Sprout} label="NDVI" value={s.kpis.ndvi.toFixed(2)} />
                        <Kpi icon={AlertTriangle} label="Sécheresse" value={`${s.kpis.drought} / 100`} />
                    </div>

                    <Title>Rendement par culture (t/ha), trait noir : moyenne nationale</Title>
                    {s.crops.map((c) => (
                        <div key={c.name} className="mb-2 grid grid-cols-[64px_1fr_40px] items-center gap-2 text-[11px]">
                            <span className="text-slate-700">{c.name}</span>
                            <div className="relative h-2 rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, (c.yield / 4) * 100)}%` }} />
                                <div className="absolute -bottom-1 -top-1 w-0.5 bg-slate-800" style={{ left: `${Math.min(100, (c.national / 4) * 100)}%` }} />
                            </div>
                            <b className="text-right text-slate-800">{c.yield}</b>
                        </div>
                    ))}

                    <Title>Pluviométrie mensuelle (mm)</Title>
                    <svg viewBox="0 0 300 90" className="w-full">
                        {s.rainfallMonthly.map((v, i) => {
                            const h = (v / Math.max(...s.rainfallMonthly, 1)) * 60;
                            return (
                                <g key={i}>
                                    <rect x={i * 25 + 4} y={70 - h} width={18} height={Math.max(1, h)} rx={2} fill="#4f8fbd" />
                                    <text x={i * 25 + 13} y={85} textAnchor="middle" fontSize={10} fill="#94a3b8">{MONTHS[i]}</text>
                                </g>
                            );
                        })}
                    </svg>

                    <Title>
                        <span className="inline-flex items-center gap-1"><TrendingUp size={11} /> Tendance du rendement</span>
                    </Title>
                    <div className="grid grid-cols-4 gap-2">
                        {s.history.map((h) => (
                            <div key={h.year} className="rounded-lg bg-slate-50 p-2 text-center">
                                <p className="text-[9px] text-slate-400">{h.year}</p>
                                <p className="text-xs font-bold text-slate-800">{h.value}</p>
                            </div>
                        ))}
                    </div>

                    <Title>Alertes</Title>
                    <div className="space-y-1.5">
                        {s.alerts.map((a, i) => (
                            <div key={i} className={`flex gap-2 rounded-lg p-2 text-[11px] ${LEVEL[a.level]}`}>
                                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                                {a.text}
                            </div>
                        ))}
                    </div>

                    <Title>Aide à la décision</Title>
                    <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-4 text-slate-700">
                        {recommendations(s).map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                </div>
            )}
        </aside>
    );
}
