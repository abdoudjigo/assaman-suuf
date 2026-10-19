import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import AppNav from "./AppNav";

/* En-tête commun des pages d'analyse : identité, sous-titre, menu principal et actions. */
function PageHeader({ icon: Icon, subtitle, actions }: { icon: LucideIcon; subtitle: string; actions?: ReactNode }) {
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-emerald-700 p-2.5 text-white">
                        <Icon size={21} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Assaman-Suuf</h1>
                        <p className="truncate text-xs text-slate-500">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <AppNav />
                    {actions}
                </div>
            </div>
        </header>
    );
}

export default PageHeader;
