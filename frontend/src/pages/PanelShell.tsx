/*
|--------------------------------------------------------------------------
| PANNEAU GÉNÉRIQUE
|--------------------------------------------------------------------------
*/


import {X} from "lucide-react";

function PanelShellHeader({
                              title,
                              subtitle,
                              icon: Icon,
                              onClose,
                          }){
    return(

        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900">
                    {title}
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-400">
                    {subtitle}
                </p>
            </div>

            <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
                <X size={17} />
            </button>
        </div>
    )
}

function PanelShell({
                        title,
                        subtitle,
                        icon: Icon,
                        onClose,
                        children,
                        width = "w-[400px]",
                    }) {
    return (
        <aside
            className={`absolute bottom-20 left-4 top-20 z-50 flex ${width} max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl`}
        >
            <PanelShellHeader icon={icon} title={title} subtitle={subtitle} onClose={onClose}/>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {children}
            </div>
        </aside>
    );
}

export default PanelShell;