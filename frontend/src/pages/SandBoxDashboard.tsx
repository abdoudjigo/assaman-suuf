
import { useState } from "react";
import axios from "axios";
import {
    Activity,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Code2,
    Copy,
    ExternalLink,
    LoaderCircle,
    Play,
    RefreshCw,
    Server,
    Terminal,
    XCircle,
} from "lucide-react";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
        Accept: "application/json",
    },
});

function SandBoxDashboard({ onToggle, initialPath = "/openapi.json" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [path, setPath] = useState(initialPath);
    const [method, setMethod] = useState("GET");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [requestTime, setRequestTime] = useState(null);

    const togglePanel = () => {
        const next = !isOpen;
        setIsOpen(next);
        onToggle?.(next);
    };

    const executeRequest = async () => {
        const normalizedPath = path.trim();

        if (!normalizedPath) {
            setError("Saisis une route API.");
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);
        setRequestTime(null);

        const startedAt = performance.now();

        try {
            const result = await api.request({
                url: normalizedPath,
                method,
            });

            const duration = Math.round(performance.now() - startedAt);

            setResponse(result.data);
            setRequestTime(duration);

            setHistory((previous) => [
                {
                    path: normalizedPath,
                    method,
                    status: result.status,
                    duration,
                    time: new Date().toLocaleTimeString(),
                    success: true,
                },
                ...previous,
            ].slice(0, 8));
        } catch (err) {
            const duration = Math.round(performance.now() - startedAt);

            const message = err.response
                ? `HTTP ${err.response.status}: ${
                    typeof err.response.data?.detail === "string"
                        ? err.response.data.detail
                        : err.response.statusText || "Erreur API"
                }`
                : err.code === "ECONNABORTED"
                    ? "Délai d'attente dépassé."
                    : "Connexion impossible. Vérifie FastAPI, l'URL et le CORS.";

            setError(message);

            if (err.response?.data !== undefined) {
                setResponse(err.response.data);
            }

            setRequestTime(duration);

            setHistory((previous) => [
                {
                    path: normalizedPath,
                    method,
                    status: err.response?.status || "Erreur",
                    duration,
                    time: new Date().toLocaleTimeString(),
                    success: false,
                },
                ...previous,
            ].slice(0, 8));
        } finally {
            setLoading(false);
        }
    };

    const copyResponse = async () => {
        if (response === null) return;

        try {
            await navigator.clipboard.writeText(
                JSON.stringify(response, null, 2)
            );
        } catch {
            setError("Impossible de copier la réponse.");
        }
    };

    return (
        <section
            className={`fixed inset-x-0 bottom-0 z-[60] flex flex-col border-t border-slate-700 bg-slate-950 text-slate-100 shadow-2xl transition-[height] duration-500 ease-in-out ${
                isOpen
                    ? "h-[min(65vh,540px)]"
                    : "h-[54px]"
            }`}
        >
            {/* Barre toujours visible */}
            <div className="flex h-[54px] shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4">
                <button
                    type="button"
                    onClick={togglePanel}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                        <Terminal size={17} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                                Sandbox API
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                                FASTAPI
                            </span>
                        </div>

                        <p className="truncate text-[10px] text-slate-500">
                            {API_BASE_URL}
                        </p>
                    </div>
                </button>

                <div className="flex shrink-0 items-center gap-2">
                    {loading && (
                        <LoaderCircle
                            size={16}
                            className="animate-spin text-indigo-400"
                        />
                    )}

                    {!loading && response !== null && (
                        <CheckCircle2
                            size={16}
                            className="text-emerald-400"
                        />
                    )}

                    {!loading && error && (
                        <XCircle
                            size={16}
                            className="text-red-400"
                        />
                    )}

                    <button
                        type="button"
                        onClick={togglePanel}
                        className="rounded-lg p-2 hover:bg-slate-800"
                        aria-label={isOpen ? "Réduire le Sandbox" : "Ouvrir le Sandbox"}
                    >
                        {isOpen
                            ? <ChevronDown size={18} />
                            : <ChevronUp size={18} />}
                    </button>
                </div>
            </div>

            {/* Contenu du panneau */}
            <div
                className={`min-h-0 flex-1 overflow-y-auto transition-opacity duration-300 ${
                    isOpen
                        ? "opacity-100"
                        : "pointer-events-none opacity-0"
                }`}
                aria-hidden={!isOpen}
            >
                <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
                    {/* Console API */}
                    <div className="min-w-0 space-y-4 p-4">
                        <div className="flex items-center gap-2">
                            <Server size={16} className="text-indigo-400" />
                            <h3 className="text-sm font-semibold">
                                Exécuter une requête
                            </h3>
                        </div>

                        <p className="text-xs leading-5 text-slate-400">
                            Interroge ton API et consulte directement les données
                            retournées par FastAPI.
                        </p>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                executeRequest();
                            }}
                            className="flex flex-col gap-2 sm:flex-row"
                        >
                            <select
                                value={method}
                                onChange={(event) => setMethod(event.target.value)}
                                className="h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-semibold outline-none focus:border-indigo-500"
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                            </select>

                            <input
                                value={path}
                                onChange={(event) => setPath(event.target.value)}
                                placeholder="/api/route"
                                aria-label="Route FastAPI"
                                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 font-mono text-xs outline-none focus:border-indigo-500"
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading
                                    ? <LoaderCircle size={15} className="animate-spin" />
                                    : <Play size={15} />}
                                Exécuter
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            <span>Base URL :</span>
                            <code className="break-all text-indigo-300">
                                {API_BASE_URL}
                            </code>
                            <a
                                href={`${API_BASE_URL}/docs`}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-auto inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                            >
                                Documentation <ExternalLink size={11} />
                            </a>
                        </div>

                        {/* Erreur */}
                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-xs leading-5 text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        {/* Réponse */}
                        <div className="overflow-hidden rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <Code2 size={14} className="text-emerald-400" />
                                    <span className="text-xs font-semibold">
                                        Réponse de l'API
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {requestTime !== null && (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                            <Clock size={11} />
                                            {requestTime} ms
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={copyResponse}
                                        disabled={response === null}
                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                                        title="Copier le JSON"
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-64 overflow-auto bg-black/20 p-3">
                                {loading ? (
                                    <div className="flex items-center gap-2 py-6 text-xs text-indigo-300">
                                        <LoaderCircle size={15} className="animate-spin" />
                                        Attente de la réponse FastAPI...
                                    </div>
                                ) : response !== null ? (
                                    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-emerald-300">
                                        {JSON.stringify(response, null, 2)}
                                    </pre>
                                ) : (
                                    <div className="py-6 text-center">
                                        <Activity
                                            size={22}
                                            className="mx-auto mb-2 text-slate-600"
                                        />
                                        <p className="text-xs text-slate-400">
                                            Aucune réponse pour le moment.
                                        </p>
                                        <p className="mt-1 text-[10px] text-slate-600">
                                            Essaie GET /openapi.json pour vérifier la connexion.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Historique des requêtes */}
                    <aside className="border-t border-slate-800 bg-slate-900/50 p-4 lg:border-l lg:border-t-0">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-xs font-semibold">
                                Historique
                            </h3>

                            <button
                                type="button"
                                onClick={() => setHistory([])}
                                className="text-[10px] text-slate-500 hover:text-white"
                            >
                                Effacer
                            </button>
                        </div>

                        {history.length === 0 ? (
                            <p className="text-xs leading-5 text-slate-500">
                                Tes dernières requêtes apparaîtront ici.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((item, index) => (
                                    <button
                                        key={`${item.time}-${index}`}
                                        type="button"
                                        onClick={() => {
                                            setPath(item.path);
                                            setMethod(item.method);
                                        }}
                                        className="w-full rounded-lg border border-slate-800 p-3 text-left hover:bg-slate-800/70"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold text-indigo-300">
                                                {item.method}
                                            </span>

                                            <span className={`text-[10px] ${
                                                item.success
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 break-all font-mono text-[10px] text-slate-300">
                                            {item.path}
                                        </p>

                                        <p className="mt-2 text-[9px] text-slate-500">
                                            {item.time} · {item.duration} ms
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={executeRequest}
                            disabled={loading}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                        >
                            <RefreshCw size={13} />
                            Relancer la requête
                        </button>
                    </aside>
                </div>
            </div>
        </section>
    );
}

export default SandBoxDashboard;