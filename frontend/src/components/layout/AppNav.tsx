import { NavLink } from "react-router-dom";
import { FlaskConical, LayoutDashboard, Map as MapIcon, Server } from "lucide-react";

const LINKS = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/prediction", label: "Prédiction", icon: FlaskConical },
    { to: "/cartographie", label: "Cartographie", icon: MapIcon },
    { to: "/supervision", label: "Supervision API", icon: Server },
];

/* Menu principal partagé par les en-têtes des pages. Libellés masqués sur petit écran. */
function AppNav({ className = "" }: { className?: string }) {
    return (
        <nav aria-label="Navigation principale" className={`flex items-center gap-1 ${className}`}>
            {LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    title={label}
                    className={({ isActive }) =>
                        `flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition ${
                            isActive ? "bg-green-700 text-white" : "text-slate-600 hover:bg-slate-100"
                        }`
                    }
                >
                    <Icon size={16} />
                    <span className="hidden xl:inline">{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export default AppNav;
