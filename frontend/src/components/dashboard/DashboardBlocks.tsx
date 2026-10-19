import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, Inbox, LoaderCircle, RefreshCw, RotateCcw } from "lucide-react";

/* =========================================================
   Briques du Dashboard : bloc avec états, KPI, filtre
   ========================================================= */

export type BlockStatus =
    | { kind: "loading" }
    | { kind: "error"; message: string; onRetry?: () => void }
    | { kind: "empty"; message?: string }
    | { kind: "ready" };

export function BlockState({ status, minHeight = "min-h-64" }: { status: BlockStatus; minHeight?: string }) {
    if (status.kind === "loading") {
        return (
            <div className={`flex ${minHeight} flex-col items-center justify-center gap-3 text-center`} role="status">
                <LoaderCircle size={24} className="animate-spin text-emerald-700" />
                <p className="text-xs font-medium text-slate-500">Chargement des données…</p>
            </div>
        );
    }

    if (status.kind === "error") {
        return (
            <div className={`flex ${minHeight} flex-col items-center justify-center gap-3 px-4 text-center`} role="alert">
                <CircleAlert size={24} className="text-red-600" />
                <p className="max-w-sm text-xs leading-5 text-slate-600">{status.message}</p>
                {status.onRetry && (
                    <button
                        type="button"
                        onClick={status.onRetry}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <RefreshCw size={14} /> Réessayer
                    </button>
                )}
            </div>
        );
    }

    if (status.kind === "empty") {
        return (
            <div className={`flex ${minHeight} flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center`}>
                <Inbox size={22} className="text-slate-400" />
                <p className="max-w-sm text-xs leading-5 text-slate-500">
                    {status.message ?? "Aucune donnée pour les filtres sélectionnés."}
                </p>
            </div>
        );
    }

    return null;
}

export function ChartCard({
    title,
    subtitle,
    status,
    actions,
    aside,
    footer,
    children,
    busy = false,
    className = "",
}: {
    title: string;
    subtitle?: string;
    status: BlockStatus;
    actions?: ReactNode;
    aside?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
    busy?: boolean; // ancien résultat affiché pendant le chargement des nouveaux filtres
    className?: string;
}) {
    return (
        <section aria-busy={busy} className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                    {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                </div>
                {actions}
            </header>

            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
                <div className={`min-w-0 flex-1 transition-opacity ${busy ? "opacity-50" : ""}`}>
                    {status.kind === "ready" ? children : <BlockState status={status} />}
                </div>
                {aside}
            </div>

            {footer && <footer className="mt-3 text-[11px] leading-4 text-slate-500">{footer}</footer>}
        </section>
    );
}

export function KpiCard({
    label,
    value,
    unit,
    hint,
    icon: Icon,
    status,
    tone = "neutral",
}: {
    label: string;
    value: string;
    unit?: string;
    hint?: ReactNode;
    icon: LucideIcon;
    status: BlockStatus;
    tone?: "neutral" | "up" | "down";
}) {
    const valueColor = tone === "up" ? "text-emerald-700" : tone === "down" ? "text-red-700" : "text-slate-900";

    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                    <Icon size={17} />
                </div>
            </div>

            {status.kind === "ready" ? (
                <>
                    <p className="mt-2 flex items-baseline gap-1 truncate">
                        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</span>
                        {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
                    </p>
                    {hint && <p className="mt-1 text-[11px] leading-4 text-slate-500">{hint}</p>}
                </>
            ) : status.kind === "loading" ? (
                <div className="mt-3 space-y-2" role="status" aria-label="Chargement">
                    <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                </div>
            ) : (
                <p className={`mt-3 text-xs ${status.kind === "error" ? "text-red-700" : "text-slate-500"}`}>
                    {status.kind === "error" ? "Indisponible" : "Aucune donnée"}
                </p>
            )}
        </div>
    );
}

export function FilterSelect<T extends string | number>({
    label,
    value,
    options,
    onChange,
    allLabel = "Toutes",
    disabled = false,
}: {
    label: string;
    value: T | null;
    options: T[];
    onChange: (value: T | null) => void;
    allLabel?: string | null; // null : champ obligatoire, pas d'option « Toutes »
    disabled?: boolean;
}) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <select
                value={value === null ? "" : String(value)}
                disabled={disabled}
                onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === "") return onChange(null);
                    const match = options.find((option) => String(option) === raw);
                    onChange(match ?? null);
                }}
                className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:bg-white disabled:opacity-50"
            >
                {allLabel !== null && <option value="">{allLabel}</option>}
                {options.map((option) => (
                    <option key={String(option)} value={String(option)}>
                        {String(option)}
                    </option>
                ))}
            </select>
        </label>
    );
}

/**
 * Barre de filtres / formulaire : grille de champs + actions (Réinitialiser, Envoyer…).
 * Avec `onSubmit`, la barre est un <form> (Entrée valide).
 */
export function FilterBar({
    children,
    onReset,
    canReset = true,
    actions,
    footer,
    onSubmit,
    gridClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto]",
}: {
    children: ReactNode;
    onReset?: () => void;
    canReset?: boolean;
    actions?: ReactNode;
    footer?: ReactNode;
    onSubmit?: () => void;
    gridClassName?: string;
}) {
    const content = (
        <>
            <div className={`grid gap-3 ${gridClassName}`}>
                {children}
                {(onReset || actions) && (
                    <div className="col-span-full flex items-end gap-2 sm:col-span-1">
                        {onReset && (
                            <button
                                type="button"
                                onClick={onReset}
                                disabled={!canReset}
                                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                {/* index.css impose `button { font: inherit }` : la taille est portée par le span. */}
                                <RotateCcw size={14} /> <span className="text-xs">Réinitialiser</span>
                            </button>
                        )}
                        {actions}
                    </div>
                )}
            </div>
            {footer && <div className="mt-3 text-[11px] text-slate-500">{footer}</div>}
        </>
    );

    const className = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

    return onSubmit ? (
        <form
            className={className}
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            {content}
        </form>
    ) : (
        <section className={className}>{content}</section>
    );
}

/** Champ numérique saisi en texte (pas de 0 implicite : vide = null), avec unité, aide et erreur. */
export function NumberField({
    label,
    value,
    onChange,
    unit,
    placeholder,
    hint,
    error,
    step = "any",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    unit?: string;
    placeholder?: string;
    hint?: string;
    error?: string | null;
    step?: string;
}) {
    return (
        <label className="flex min-w-0 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            <span className="relative">
                <input
                    type="number"
                    inputMode="decimal"
                    step={step}
                    value={value}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(event.target.value)}
                    className={`h-10 w-full min-w-0 rounded-xl border bg-slate-50 px-3 pr-12 text-sm text-slate-800 outline-none transition focus:bg-white ${
                        error ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-green-500"
                    }`}
                />
                {unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>}
            </span>
            {error ? (
                <span className="text-[11px] text-red-700">{error}</span>
            ) : (
                hint && <span className="text-[11px] text-slate-400">{hint}</span>
            )}
        </label>
    );
}
