
import { useMemo, useState } from "react";
import axios from "axios";
import AppNav from "../components/layout/AppNav";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    Clock3,
    CloudRain,
    Code2,
    Database,
    ExternalLink,
    Layers3,
    LoaderCircle,
    MapPin,
    Play,
    RefreshCw,
    Server,
    ShieldCheck,
    Terminal,
    Trash2,
    Wifi,
    XCircle,
} from "lucide-react";

/* =========================================================
   1. CONFIGURATION API
   ========================================================= */

const API_BASE_URL: string =
    import.meta.env.VITE_API_BASE_URL ?? "";

type HttpMethod = "GET" | "POST";

type ApiEndpoint = {
    label: string;
    description: string;
    method: HttpMethod;
    path: string;
    category: string;
};

const API_ENDPOINTS: ApiEndpoint[] = [
    {
        label: "État de l'API",
        description: "Vérifie si le serveur API répond.",
        method: "GET",
        path: "/health",
        category: "Système",
    },
    {
        label: "Disponibilité des dépendances",
        description: "Vérifie si les dépendances nécessaires sont prêtes.",
        method: "GET",
        path: "/health/ready",
        category: "Système",
    },
    {
        label: "Données agricoles",
        description: "Récupère les données agricoles disponibles.",
        method: "GET",
        path: "/api/v1/agriculture",
        category: "Agriculture",
    },
    {
        label: "Observations climatiques",
        description: "Récupère les observations climatiques.",
        method: "GET",
        path: "/api/v1/climat",
        category: "Climat",
    },
    {
        label: "Campagnes agroclimatiques",
        description: "Récupère les campagnes agroclimatiques.",
        method: "GET",
        path: "/api/v1/agroclimat",
        category: "Agroclimat",
    },
    {
        label: "Zones géographiques",
        description: "Récupère les zones géographiques.",
        method: "GET",
        path: "/api/v1/zones",
        category: "Géographie",
    },
    {
        label: "Stations climatiques",
        description: "Récupère les stations météorologiques.",
        method: "GET",
        path: "/api/v1/stations",
        category: "Climat",
    },
    {
        label: "Produits agricoles",
        description: "Récupère les produits agricoles disponibles.",
        method: "GET",
        path: "/api/v1/produits",
        category: "Agriculture",
    },
    {
        label: "Options de prédiction",
        description: "Récupère les options acceptées par le modèle.",
        method: "GET",
        path: "/api/v1/predictions/options",
        category: "Prédictions",
    },
    {
        label: "Prédiction du rendement",
        description: "Soumet une demande de prédiction de rendement.",
        method: "POST",
        path: "/api/v1/predictions/rendement",
        category: "Prédictions",
    },
];

/* =========================================================
   2. TYPES
   ========================================================= */

type ApiLogEntry = {
    id: string;
    timestamp: string;
    method: HttpMethod;
    endpoint: string;
    status: number | "ERROR";
    durationMs: number;
    message: string;
};

type ApiResult = {
    endpoint: string;
    method: HttpMethod;
    status: number;
    durationMs: number;
    timestamp: string;
    data: unknown;
};

/* =========================================================
   3. FONCTIONS UTILITAIRES
   ========================================================= */

function formatDate(value: string): string {
    return new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function getItemCount(data: unknown): number | null {
    if (Array.isArray(data)) {
        return data.length;
    }

    if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;

        for (const key of ["items", "results", "data", "zones", "stations"]) {
            if (Array.isArray(record[key])) {
                return (record[key] as unknown[]).length;
            }
        }
    }

    return null;
}

function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;

        if (typeof responseData === "string" && responseData.trim()) {
            return responseData;
        }

        if (responseData && typeof responseData === "object") {
            const record = responseData as Record<string, unknown>;

            if (typeof record.detail === "string") {
                return record.detail;
            }

            if (Array.isArray(record.detail)) {
                return JSON.stringify(record.detail, null, 2);
            }

            return JSON.stringify(responseData, null, 2);
        }

        if (error.code === "ECONNABORTED") {
            return "La requête a dépassé le délai d'attente autorisé.";
        }

        if (!error.response) {
            return (
                "Impossible de joindre l'API. Vérifie que le serveur FastAPI " +
                "est démarré et que l'URL de l'API est correcte."
            );
        }

        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Une erreur inconnue est survenue.";
}

/* =========================================================
   4. COMPOSANTS RÉUTILISABLES
   ========================================================= */

function StatCard({
                      label,
                      value,
                      description,
                      icon: Icon,
                  }: {
    label: string;
    value: string | number;
    description: string;
    icon: typeof Activity;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <Icon size={21} />
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">{description}</p>
        </div>
    );
}

function SectionTitle({
                          title,
                          description,
                          icon: Icon,
                      }: {
    title: string;
    description: string;
    icon: typeof Database;
}) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <Icon size={21} />
            </div>

            <div>
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
        </div>
    );
}

/* =========================================================
   5. COMPOSANT PRINCIPAL
   ========================================================= */

function DashboardApiRun() {
    const [selectedEndpoint, setSelectedEndpoint] =
        useState("/api/v1/zones");

    const [requestBody, setRequestBody] = useState(
        JSON.stringify({}, null, 2)
    );

    const [result, setResult] = useState<ApiResult | null>(null);
    const [logs, setLogs] = useState<ApiLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consoleOpen, setConsoleOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<"result" | "json">("result");

    const selectedConfig = useMemo(
        () =>
            API_ENDPOINTS.find(
                (endpoint) => endpoint.path === selectedEndpoint
            ) ?? API_ENDPOINTS[0],
        [selectedEndpoint]
    );

    const successfulRequests = logs.filter(
        (log) =>
            typeof log.status === "number" &&
            log.status >= 200 &&
            log.status < 300
    ).length;

    const failedRequests = logs.length - successfulRequests;

    const latestDuration = logs.length ? logs[0].durationMs : 0;

    const resultCount = result ? getItemCount(result.data) : null;

    /* ---------------------------------------------------------
       Exécuter une requête API
       --------------------------------------------------------- */

    async function handleQueryApi() {
        const config = API_ENDPOINTS.find(
            (endpoint) => endpoint.path === selectedEndpoint
        );

        if (!config) {
            setError("Endpoint API non reconnu.");
            return;
        }

        let body: unknown;

        if (config.method === "POST") {
            try {
                body = JSON.parse(requestBody);
            } catch {
                setError(
                    "Le corps de la requête n'est pas un JSON valide. " +
                    "Vérifie les accolades, les virgules et les guillemets."
                );
                return;
            }
        }

        const startedAt = performance.now();
        const timestamp = new Date().toISOString();

        setLoading(true);
        setError(null);

        try {
            const response = await axios.request({
                baseURL: API_BASE_URL,
                url: config.path,
                method: config.method,
                ...(config.method === "POST" ? { data: body } : {}),
                headers: {
                    Accept: "application/json",
                    ...(config.method === "POST"
                        ? { "Content-Type": "application/json" }
                        : {}),
                },
                timeout: 30000,
            });

            const durationMs = Math.round(performance.now() - startedAt);

            setResult({
                endpoint: config.path,
                method: config.method,
                status: response.status,
                durationMs,
                timestamp,
                data: response.data,
            });

            setActiveTab("result");

            setLogs((current) =>
                [
                    {
                        id: `${Date.now()}-${Math.random()}`,
                        timestamp,
                        method: config.method,
                        endpoint: config.path,
                        status: response.status,
                        durationMs,
                        message: "Requête exécutée avec succès.",
                    },
                    ...current,
                ].slice(0, 100)
            );
        } catch (requestError: unknown) {
            const durationMs = Math.round(performance.now() - startedAt);
            const message = getErrorMessage(requestError);

            const status = axios.isAxiosError(requestError)
                ? requestError.response?.status ?? "ERROR"
                : "ERROR";

            setError(message);

            setLogs((current) =>
                [
                    {
                        id: `${Date.now()}-${Math.random()}`,
                        timestamp,
                        method: config.method,
                        endpoint: config.path,
                        status,
                        durationMs,
                        message,
                    },
                    ...current,
                ].slice(0, 100)
            );
        } finally {
            setLoading(false);
        }
    }

    function handleEndpointChange(path: string) {
        setSelectedEndpoint(path);
        setError(null);
    }

    function clearLogs() {
        setLogs([]);
    }

    async function copyResult() {
        if (!result) return;

        try {
            await navigator.clipboard.writeText(
                JSON.stringify(result.data, null, 2)
            );
        } catch {
            setError(
                "Impossible de copier automatiquement le résultat. " +
                "Sélectionne le JSON et copie-le manuellement."
            );
        }
    }

    /* ---------------------------------------------------------
       Interface
       --------------------------------------------------------- */

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* En-tête */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-700 p-2.5 text-white">
                            <Layers3 size={23} />
                        </div>

                        <div>
                            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                                Assaman-Suuf
                            </h1>
                            <p className="text-xs text-slate-500">
                                Plateforme agroclimatique · Dashboard API
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <AppNav />
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <span
                  className={`h-2 w-2 rounded-full ${
                      loading ? "animate-pulse bg-amber-500" : "bg-emerald-500"
                  }`}
              />
                            <span className="text-xs font-semibold text-slate-600">
                {loading ? "Requête en cours" : "Client API prêt"}
              </span>
                        </div>

                        <a
                            href={`${API_BASE_URL}/docs`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                        >
                            Documentation Swagger
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-[1600px] space-y-7 px-4 py-6 sm:px-6 lg:px-8">
                {/* Introduction */}
                <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 p-6 text-white shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                                <CloudRain size={14} />
                                Agriculture · Climat · Géographie
                            </div>

                            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Centre de supervision des données
                            </h2>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/85">
                                Interroge les services FastAPI, consulte les réponses JSON
                                et surveille les performances des requêtes de la plateforme
                                agroclimatique.
                            </p>
                        </div>

                        <div className="min-w-0 rounded-xl border border-white/15 bg-black/10 p-4 lg:min-w-72">
                            <p className="text-xs font-medium text-emerald-100/80">
                                URL de base configurée
                            </p>
                            <p className="mt-2 break-all font-mono text-sm text-white">
                                {API_BASE_URL || "Même origine que le frontend"}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100">
                                <Wifi size={14} />
                                <span>Requêtes HTTP via Axios</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistiques */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        label="Endpoints disponibles"
                        value={API_ENDPOINTS.length}
                        description="Services configurés dans ce dashboard."
                        icon={Server}
                    />

                    <StatCard
                        label="Requêtes réussies"
                        value={successfulRequests}
                        description="Réponses HTTP comprises entre 200 et 299."
                        icon={CheckCircle2}
                    />

                    <StatCard
                        label="Requêtes en erreur"
                        value={failedRequests}
                        description="Échecs HTTP ou problèmes de connexion."
                        icon={AlertCircle}
                    />

                    <StatCard
                        label="Dernier temps de réponse"
                        value={`${latestDuration} ms`}
                        description="Durée de la dernière tentative enregistrée."
                        icon={Clock3}
                    />
                </section>

                {/* Zone principale */}
                <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                    {/* Panneau de requête */}
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <SectionTitle
                            title="Explorateur API"
                            description="Choisis un endpoint et exécute une requête."
                            icon={Database}
                        />

                        <div className="space-y-5">
                            <div>
                                <label
                                    htmlFor="endpoint"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Service à interroger
                                </label>

                                <div className="relative">
                                    <select
                                        id="endpoint"
                                        value={selectedEndpoint}
                                        onChange={(event) =>
                                            handleEndpointChange(event.target.value)
                                        }
                                        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-10 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        {API_ENDPOINTS.map((endpoint) => (
                                            <option key={endpoint.path} value={endpoint.path}>
                                                {endpoint.method} · {endpoint.label}
                                            </option>
                                        ))}
                                    </select>

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                    />
                                </div>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    {selectedConfig.description}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-center gap-2">
                  <span
                      className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${
                          selectedConfig.method === "GET"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-violet-100 text-violet-700"
                      }`}
                  >
                    {selectedConfig.method}
                  </span>

                                    <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600">
                    {selectedConfig.category}
                  </span>
                                </div>

                                <p className="mt-3 break-all font-mono text-sm font-semibold text-slate-800">
                                    {selectedConfig.path}
                                </p>
                            </div>

                            {selectedConfig.method === "POST" && (
                                <div>
                                    <label
                                        htmlFor="requestBody"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Corps de la requête JSON
                                    </label>

                                    <textarea
                                        id="requestBody"
                                        value={requestBody}
                                        onChange={(event) => setRequestBody(event.target.value)}
                                        rows={9}
                                        spellCheck={false}
                                        className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-100 outline-none focus:border-emerald-500"
                                        placeholder={'{\n  "parametre": "valeur"\n}'}
                                    />

                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                        Remplace le contenu par les champs réellement attendus
                                        par le schéma Pydantic de ton endpoint.
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleQueryApi}
                                disabled={loading}
                                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <LoaderCircle size={18} className="animate-spin" />
                                        Exécution en cours…
                                    </>
                                ) : (
                                    <>
                                        <Play size={17} />
                                        Interroger cet endpoint
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setResult(null);
                                    setError(null);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                                <Trash2 size={15} />
                                Effacer le résultat affiché
                            </button>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-emerald-700" />
                                    <p className="text-sm font-bold text-slate-800">
                                        Configuration de connexion
                                    </p>
                                </div>

                                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                                    {API_BASE_URL || "URL relative — configuration Vite requise"}
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Si le frontend et l'API utilisent des ports différents,
                                    configure VITE_API_BASE_URL ou un proxy Vite.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Panneau de résultat */}
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 p-5 sm:p-6">
                            <SectionTitle
                                title="Résultat de la requête"
                                description="Réponse réelle renvoyée par le serveur."
                                icon={Code2}
                            />

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("result")}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                        activeTab === "result"
                                            ? "bg-emerald-700 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Vue synthétique
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("json")}
                                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                        activeTab === "json"
                                            ? "bg-emerald-700 text-white"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    Réponse JSON
                                </button>

                                {result && (
                                    <button
                                        type="button"
                                        onClick={copyResult}
                                        className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        Copier JSON
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            {error && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-start gap-2">
                                        <XCircle
                                            size={18}
                                            className="mt-0.5 shrink-0 text-red-600"
                                        />

                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-red-800">
                                                Échec de la requête
                                            </p>
                                            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-xs leading-5 text-red-700">
                        {error}
                      </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {loading && (
                                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                                    <LoaderCircle
                                        size={34}
                                        className="animate-spin text-emerald-700"
                                    />
                                    <p className="mt-4 text-sm font-bold text-slate-800">
                                        Communication avec le serveur
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {selectedConfig.method} {selectedConfig.path}
                                    </p>
                                </div>
                            )}

                            {!loading && !result && !error && (
                                <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                                    <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-sm">
                                        <Terminal size={30} />
                                    </div>

                                    <h3 className="mt-4 text-sm font-bold text-slate-800">
                                        Aucune réponse pour le moment
                                    </h3>

                                    <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                        Sélectionne un endpoint, puis lance une requête pour
                                        afficher les données retournées par FastAPI.
                                    </p>
                                </div>
                            )}

                            {!loading && result && activeTab === "result" && (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2
                                                size={19}
                                                className="text-emerald-700"
                                            />
                                            <p className="text-sm font-bold text-emerald-900">
                                                Réponse reçue avec succès
                                            </p>
                                        </div>

                                        <p className="mt-2 break-all font-mono text-xs text-emerald-800">
                                            {result.method} {result.endpoint}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-500">Statut HTTP</p>
                                            <p className="mt-2 text-xl font-bold text-emerald-700">
                                                {result.status}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-500">Durée</p>
                                            <p className="mt-2 text-xl font-bold text-slate-900">
                                                {result.durationMs} ms
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 p-4">
                                            <p className="text-xs text-slate-500">
                                                Éléments détectés
                                            </p>
                                            <p className="mt-2 text-xl font-bold text-slate-900">
                                                {resultCount ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-bold text-slate-800">
                                            Structure de la réponse
                                        </p>

                                        <div className="max-h-[440px] overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4">
                      <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-emerald-100">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-400">
                                        Requête effectuée le {formatDate(result.timestamp)}
                                    </p>
                                </div>
                            )}

                            {!loading && result && activeTab === "json" && (
                                <div className="max-h-[600px] overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-4">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-emerald-100">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Historique et console */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 sm:p-6">
                        <SectionTitle
                            title="Console et historique API"
                            description="Journal des requêtes, statuts HTTP et durées."
                            icon={Activity}
                        />

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setConsoleOpen((open) => !open)}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <Terminal size={15} />
                                {consoleOpen ? "Masquer" : "Afficher"}
                            </button>

                            <button
                                type="button"
                                onClick={clearLogs}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <Trash2 size={14} />
                                Vider l'historique
                            </button>
                        </div>
                    </div>

                    {consoleOpen && (
                        <div>
                            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs text-slate-500">Total des requêtes</p>
                                    <p className="mt-1 text-lg font-bold text-slate-900">
                                        {logs.length}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs text-slate-500">Succès</p>
                                    <p className="mt-1 text-lg font-bold text-emerald-700">
                                        {successfulRequests}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-xs text-slate-500">Échecs</p>
                                    <p className="mt-1 text-lg font-bold text-red-600">
                                        {failedRequests}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-xs">
                                    <thead className="border-b border-slate-200 bg-white text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Heure</th>
                                        <th className="px-5 py-4 font-semibold">Méthode</th>
                                        <th className="px-5 py-4 font-semibold">Endpoint</th>
                                        <th className="px-5 py-4 font-semibold">Statut</th>
                                        <th className="px-5 py-4 font-semibold">Durée</th>
                                        <th className="px-5 py-4 font-semibold">Message</th>
                                    </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {formatDate(log.timestamp)}
                                            </td>

                                            <td className="px-5 py-4">
                          <span
                              className={`rounded-md px-2 py-1 font-bold ${
                                  log.method === "GET"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-violet-100 text-violet-700"
                              }`}
                          >
                            {log.method}
                          </span>
                                            </td>

                                            <td className="max-w-64 break-all px-5 py-4 font-mono text-slate-700">
                                                {log.endpoint}
                                            </td>

                                            <td className="px-5 py-4">
                          <span
                              className={`rounded-md px-2 py-1 font-bold ${
                                  typeof log.status === "number" &&
                                  log.status >= 200 &&
                                  log.status < 300
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                              }`}
                          >
                            {log.status}
                          </span>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {log.durationMs} ms
                                            </td>

                                            <td className="max-w-64 whitespace-normal break-words px-5 py-4 text-slate-500">
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}

                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center">
                                                <Activity
                                                    size={25}
                                                    className="mx-auto text-slate-300"
                                                />
                                                <p className="mt-3 text-sm font-semibold text-slate-600">
                                                    Aucune requête enregistrée
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    L'historique sera alimenté à chaque tentative.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>

                {/* Raccourcis des services */}
                <section>
                    <SectionTitle
                        title="Services disponibles"
                        description="Accède rapidement aux principales catégories de données."
                        icon={MapPin}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                title: "Géographie",
                                description: "Zones géographiques",
                                path: "/api/v1/zones",
                                icon: MapPin,
                            },
                            {
                                title: "Climat",
                                description: "Observations et stations",
                                path: "/api/v1/climat",
                                icon: CloudRain,
                            },
                            {
                                title: "Agriculture",
                                description: "Données et produits agricoles",
                                path: "/api/v1/agriculture",
                                icon: Layers3,
                            },
                            {
                                title: "Prédictions",
                                description: "Options du modèle de rendement",
                                path: "/api/v1/predictions/options",
                                icon: Activity,
                            },
                        ].map((service) => {
                            const Icon = service.icon;

                            return (
                                <button
                                    key={service.path}
                                    type="button"
                                    onClick={() => {
                                        handleEndpointChange(service.path);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm"
                                >
                                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 transition group-hover:bg-emerald-100">
                                        <Icon size={21} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800">
                                            {service.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {service.description}
                                        </p>
                                    </div>

                                    <RefreshCw
                                        size={15}
                                        className="shrink-0 text-slate-400 transition group-hover:text-emerald-700"
                                    />
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Pied de page */}
                <footer className="border-t border-slate-200 py-5">
                    <div className="flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
                        <p>Assaman-Suuf · Supervision des services agroclimatiques</p>
                        <p>React · TypeScript · Axios · FastAPI</p>
                    </div>
                </footer>
            </main>
        </div>
    );
}


export default DashboardApiRun;