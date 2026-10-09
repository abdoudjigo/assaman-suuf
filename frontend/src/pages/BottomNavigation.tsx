import {MapIcon,Filter,BarChart3,AlertTriangle,Activity,Satellite,Layers} from "lucide-react";

/*
|--------------------------------------------------------------------------
| NAVIGATION INFÉRIEURE
|--------------------------------------------------------------------------
*/

function BottomNavigation({
                              activeView,
                              setActiveView,
                              activeLayerCount,
                          }) {
    const items = [
        {
            id: "map",
            label: "Carte",
            icon: MapIcon,
        },
        {
            id: "filters",
            label: "Filtres",
            icon: Filter,
        },
        {
            id: "analysis",
            label: "Analyse",
            icon: BarChart3,
        },
        {
            id: "risks",
            label: "Risques",
            icon: AlertTriangle,
        },
        {
            id: "history",
            label: "Historique",
            icon: Activity,
        },
        {
            id: "satellite",
            label: "Satellite",
            icon: Satellite,
        },
        {
            id: "layers",
            label: "Couches",
            icon: Layers,
            badge: activeLayerCount,
        },
    ];

    return (
        <nav className="absolute bottom-3 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl">
            {items.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() =>
                            setActiveView((current) =>
                                current === item.id ? null : item.id
                            )
                        }
                        className={`relative flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                            active
                                ? "bg-green-600 text-white"
                                : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        <Icon size={17} />

                        <span className="text-[9px] font-semibold">
              {item.label}
            </span>

                        {item.badge > 0 && (
                            <span
                                className={`absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold ${
                                    active
                                        ? "bg-white text-green-700"
                                        : "bg-green-600 text-white"
                                }`}
                            >
                {item.badge}
              </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
}


export default BottomNavigation;