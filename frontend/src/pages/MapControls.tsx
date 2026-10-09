/*
|--------------------------------------------------------------------------
| CONTRÔLES DE CARTE
|--------------------------------------------------------------------------
*/

function MapControls({
                         zoom,
                         setZoom,
                         onLocate,
                         baseMap,
                         onOpenBaseMap,
                     }) {
    return (
        <div className="absolute right-4 top-20 z-20 flex flex-col gap-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur">
                <button
                    onClick={() => setZoom((value) => Math.min(value + 1, 18))}
                    className="flex h-11 w-11 items-center justify-center border-b border-slate-100 hover:bg-slate-50"
                    title="Zoom avant"
                >
                    <Plus size={18} />
                </button>

                <div className="flex h-8 items-center justify-center text-[10px] font-semibold text-slate-500">
                    Z{zoom}
                </div>

                <button
                    onClick={() => setZoom((value) => Math.max(value - 1, 3))}
                    className="flex h-11 w-11 items-center justify-center border-t border-slate-100 hover:bg-slate-50"
                    title="Zoom arrière"
                >
                    <Minus size={18} />
                </button>
            </div>

            <button
                onClick={onLocate}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 shadow-lg hover:bg-slate-50"
                title="Ma position"
            >
                <LocateFixed size={18} />
            </button>

            <button
                onClick={onOpenBaseMap}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/95 shadow-lg hover:bg-slate-50"
                title={`Fond : ${baseMap}`}
            >
                <Layers size={18} />
            </button>
        </div>
    );
}


export default MapControls;