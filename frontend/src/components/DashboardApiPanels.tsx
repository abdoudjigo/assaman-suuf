import {
    Activity,
    AlertTriangle,
    BarChart3,
    Code2,
    Database,
    RefreshCw,
    X,
} from "lucide-react";
import { API_BASE_URL } from "../services/dashboardApi";

export type ApiLogEntry = {
    id: string;
    timestamp: string;
    method: string;
    endpoint: string;
    status: number | "ERROR";
    durationMs: number;
    message: string;
};

export function ApiResultsPanel({
                             open,
                             loading,
                             error,
                             data,
                             logs,
                             consoleOpen,
                             onToggleConsole,
                             onClose,
                             onRefresh,
                         }: {
    open: boolean;
    loading: boolean;
    error: string | null;
    data: unknown;
    logs: ApiLogEntry[];
    consoleOpen: boolean;
    onToggleConsole: () => void;
    onClose: () => void;
    onRefresh: () => void;
}) {
    if (!open) return null;

    return (
        <section
            aria-label="Résultats de l'API"
            className="absolute bottom-[5.5rem] left-1/2 z-40 flex max-h-[48vh] w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl"
        >
            <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                        <Database size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900">Résultats de l'interrogation API</h2>
                        <p className="text-[10px] text-slate-500">Données retournées par le backend Assaman-Suuf</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={onRefresh} disabled={loading} title="Relancer la requête" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button type="button" onClick={onToggleConsole} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${consoleOpen ? "border-green-200 bg-green-50 text-green-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        <Code2 size={14} /> Console ({logs.length})
                    </button>
                    <button type="button" onClick={onClose} aria-label="Fermer les résultats" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <X size={16} />
                    </button>
                </div>
            </header>

            <div className="min-h-0 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><RefreshCw size={16} className="animate-spin" /> Interrogation du service en cours…</div>
                ) : error ? (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        <p className="font-bold">La requête a échoué</p>
                        <p className="mt-1 break-words">{error}</p>
                    </div>
                ) : data == null ? (
                    <div className="py-6 text-center text-xs text-slate-500">Aucun résultat pour le moment. Utilise « Interroger l'API » pour charger les zones.</div>
                ) : (
                    <>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700">Réponse JSON</p>
                            <span className="rounded-full bg-green-50 px-2 py-1 text-[9px] font-bold text-green-700">Réponse reçue</span>
                        </div>
                        <pre className="max-h-52 overflow-auto rounded-xl bg-slate-950 p-3 text-[10px] leading-5 text-emerald-100">{JSON.stringify(data, null, 2)}</pre>
                    </>
                )}

                {consoleOpen && (
                    <section className="mt-4 border-t border-slate-200 pt-4">
                        <div className="mb-2 flex items-center gap-2"><Code2 size={15} className="text-slate-500" /><h3 className="text-xs font-bold text-slate-800">Console technique</h3></div>
                        {logs.length === 0 ? (
                            <p className="text-[10px] text-slate-500">Aucune requête enregistrée.</p>
                        ) : (
                            <div className="space-y-2">
                                {logs.map((log) => (
                                    <div key={log.id} className="rounded-xl border border-slate-200 p-3">
                                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                            <span className="rounded bg-slate-100 px-2 py-1 font-bold">{log.method}</span>
                                            <code className="break-all text-slate-700">{log.endpoint}</code>
                                            <span className={`ml-auto rounded-full px-2 py-1 font-bold ${log.status === "ERROR" || (typeof log.status === "number" && log.status >= 400) ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{log.status}</span>
                                        </div>
                                        <p className="mt-2 break-words text-[10px] text-slate-600">{log.message}</p>
                                        <p className="mt-1 text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()} · {log.durationMs} ms</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </section>
    );
}

/*
|--------------------------------------------------------------------------
| DASHBOARD DES DONNÉES API (SOUS LA CARTE)
|--------------------------------------------------------------------------
| Ce panneau se trouve dans le flux normal de la page : l'opérateur
| descend sous la carte pour consulter les données renvoyées par l'API.
| Il n'invente pas de statistiques métier : il présente la structure réelle
| de la réponse jusqu'à ce que les schémas de chaque endpoint soient définis.
|--------------------------------------------------------------------------
*/

export function DashboardMapsServices({
                                   loading,
                                   error,
                                   data,
                                   logs,
                                   onRefresh,
                               }: {
    loading: boolean;
    error: string | null;
    data: unknown;
    logs: ApiLogEntry[];
    onRefresh: () => void;
}) {
    const recordCount = Array.isArray(data)
        ? data.length
        : data && typeof data === "object"
            ? Object.keys(data as Record<string, unknown>).length
            : data == null
                ? 0
                : 1;

    const latestLog = logs[0];
    const objectRows: Record<string, unknown>[] = Array.isArray(data)
        ? data.filter((item): item is Record<string, unknown> =>
            item !== null && typeof item === "object" && !Array.isArray(item)
        )
        : data && typeof data === "object"
            ? [data as Record<string, unknown>]
            : [];

    const columns = Array.from(
        new Set(objectRows.flatMap((row) => Object.keys(row)))
    ).slice(0, 6);

    const displayValue = (value: unknown) => {
        if (value == null) return "—";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
    };

    return (
        <section
            id="dashboardMapsServices"
            aria-labelledby="dashboard-maps-services-title"
            className="relative z-10 border-t border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 lg:px-10"
        >
            <div className="mx-auto max-w-screen-2xl">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                            Assaman-Suuf · Centre de décision
                        </p>
                        <h2 id="dashboard-maps-services-title" className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                            Tableau de bord agroclimatique
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Consulte les données retournées par les services API pour éclairer les décisions de l'opérateur. Les indicateurs métier détaillés seront présentés selon le schéma réel de chaque endpoint.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-800 disabled:cursor-wait disabled:opacity-60"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Actualiser les données
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-500">État du service</span>
                            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${error ? "bg-red-50 text-red-600" : loading ? "bg-amber-50 text-amber-600" : data != null ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                {error ? <AlertTriangle size={19} /> : loading ? <RefreshCw size={19} className="animate-spin" /> : <Activity size={19} />}
                            </span>
                        </div>
                        <p className="mt-3 text-lg font-bold text-slate-900">{error ? "Erreur" : loading ? "Chargement" : data != null ? "Données reçues" : "En attente"}</p>
                        <p className="mt-1 text-xs text-slate-500">Statut de la dernière interrogation</p>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-500">Éléments reçus</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Database size={19} /></span>
                        </div>
                        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{recordCount.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-slate-500">Éléments au premier niveau de la réponse</p>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-500">Requêtes enregistrées</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Code2 size={19} /></span>
                        </div>
                        <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{logs.length}</p>
                        <p className="mt-1 text-xs text-slate-500">Historique local de cette session</p>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-500">Dernière réponse</span>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><RefreshCw size={19} /></span>
                        </div>
                        <p className="mt-3 text-lg font-bold text-slate-900">{latestLog ? `${latestLog.durationMs} ms` : "—"}</p>
                        <p className="mt-1 truncate text-xs text-slate-500" title={latestLog?.endpoint ?? "Aucune requête"}>{latestLog?.endpoint ?? "Aucune requête exécutée"}</p>
                    </article>
                </div>

                {error && (
                    <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                        <div><p className="font-bold">Impossible de récupérer les données</p><p className="mt-1 break-words">{error}</p></div>
                    </div>
                )}

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]">
                    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div><h3 className="text-sm font-bold text-slate-900">Données pour l'analyse</h3><p className="mt-1 text-xs text-slate-500">Aperçu tabulaire lorsque la réponse contient des objets</p></div>
                            <BarChart3 size={19} className="shrink-0 text-green-700" />
                        </header>
                        {loading ? (
                            <div className="flex items-center gap-3 p-8 text-sm text-slate-500"><RefreshCw size={17} className="animate-spin" /> Chargement des données de l'API…</div>
                        ) : objectRows.length > 0 && columns.length > 0 ? (
                            <div className="max-w-full overflow-auto">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600"><tr>{columns.map((column) => <th key={column} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-bold">{column}</th>)}</tr></thead>
                                    <tbody>{objectRows.slice(0, 50).map((row, index) => <tr key={String(row.id ?? row.code ?? index)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">{columns.map((column) => <td key={column} className="max-w-64 px-4 py-3 text-slate-700"><span className="block truncate" title={displayValue(row[column])}>{displayValue(row[column])}</span></td>)}</tr>)}</tbody>
                                </table>
                                {objectRows.length > 50 && <p className="px-4 py-3 text-xs text-slate-500">Aperçu limité aux 50 premiers éléments. La réponse complète reste consultable ci-contre.</p>}
                            </div>
                        ) : data != null ? (
                            <div className="p-5"><p className="mb-3 text-xs text-slate-500">Structure de la réponse API</p><pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-emerald-100">{JSON.stringify(data, null, 2)}</pre></div>
                        ) : (
                            <div className="p-8 text-center"><Database size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Aucune donnée chargée</p><p className="mt-1 text-xs text-slate-500">Utilise l'icône de base de données sur la carte pour interroger le service.</p></div>
                        )}
                    </section>

                    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h3 className="text-sm font-bold text-slate-900">État de l'interrogation</h3><p className="mt-1 text-xs text-slate-500">Informations utiles pour interpréter la réponse</p></div><Activity size={19} className="text-blue-700" /></header>
                        <div className="space-y-4 p-5">
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Endpoint</p><p className="mt-1 break-all font-mono text-xs text-slate-700">{latestLog?.endpoint ?? `${API_BASE_URL}/api/v1/zones`}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Statut HTTP</p><p className="mt-1"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${latestLog?.status === "ERROR" || (typeof latestLog?.status === "number" && latestLog.status >= 400) ? "bg-red-50 text-red-700" : latestLog ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{latestLog?.status ?? "Non exécuté"}</span></p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Horodatage</p><p className="mt-1 text-xs text-slate-700">{latestLog ? new Date(latestLog.timestamp).toLocaleString() : "—"}</p></div>
                            <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message</p><p className="mt-1 break-words text-xs leading-5 text-slate-600">{latestLog?.message ?? "Lance une interrogation pour afficher le diagnostic."}</p></div>
                            <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-800 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Interroger à nouveau</button>
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
