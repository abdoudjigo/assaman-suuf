import {
    AlertTriangle,
    CloudRain,
    Info,
    ShieldAlert,
    ThermometerSun,
} from "lucide-react";

type AlertSeverity = "critical" | "warning" | "info";

interface Alert {
    id: number;
    title: string;
    description: string;
    location: string;
    severity: AlertSeverity;
    time: string;
}

interface AlertSummaryProps {
    alerts?: Alert[];
}

const defaultAlerts: Alert[] = [
    {
        id: 1,
        title: "Fortes précipitations attendues",
        description:
            "Des précipitations importantes sont prévues dans les prochaines heures.",
        location: "Casamance",
        severity: "warning",
        time: "Il y a 25 min",
    },
    {
        id: 2,
        title: "Température élevée",
        description:
            "Les températures pourraient dépasser les normales saisonnières.",
        location: "Saint-Louis",
        severity: "warning",
        time: "Il y a 1 h",
    },
    {
        id: 3,
        title: "Conditions normales",
        description:
            "Aucune anomalie climatique importante détectée.",
        location: "Dakar",
        severity: "info",
        time: "Il y a 2 h",
    },
];

const severityConfig = {
    critical: {
        icon: ShieldAlert,
        iconColor: "text-red-600",
        background: "bg-red-50",
        badge: "bg-red-100 text-red-700",
        label: "Critique",
    },

    warning: {
        icon: AlertTriangle,
        iconColor: "text-orange-600",
        background: "bg-orange-50",
        badge: "bg-orange-100 text-orange-700",
        label: "Attention",
    },

    info: {
        icon: Info,
        iconColor: "text-blue-600",
        background: "bg-blue-50",
        badge: "bg-blue-100 text-blue-700",
        label: "Information",
    },
};

const AlertSummary = ({
                          alerts = defaultAlerts,
                      }: AlertSummaryProps) => {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Alertes climatiques
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Dernières alertes détectées
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                    <ThermometerSun
                        size={20}
                        className="text-orange-600"
                    />
                </div>
            </div>

            {/* Liste des alertes */}
            <div className="mt-5 space-y-4">
                {alerts.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">
                            Aucune alerte climatique actuellement.
                        </p>
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const config = severityConfig[alert.severity];
                        const Icon = config.icon;

                        return (
                            <div
                                key={alert.id}
                                className="flex gap-4 rounded-lg border border-gray-100 p-4 transition hover:bg-gray-50"
                            >
                                {/* Icône */}
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.background}`}
                                >
                                    <Icon
                                        size={19}
                                        className={config.iconColor}
                                    />
                                </div>

                                {/* Contenu */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {alert.title}
                                        </h3>

                                        <span
                                            className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${config.badge}`}
                                        >
                      {config.label}
                    </span>
                                    </div>

                                    <p className="mt-1 text-sm leading-5 text-gray-500">
                                        {alert.description}
                                    </p>

                                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                        <span>{alert.location}</span>
                                        <span>•</span>
                                        <span>{alert.time}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
                <button
                    type="button"
                    className="mt-5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Voir toutes les alertes
                </button>
            )}
        </div>
    );
};

export default AlertSummary;