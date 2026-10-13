import {Search,Bell,Settings,UserRound,Sprout} from "lucide-react"

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/


const DashBoardHeaderIcon= ()=>{

    return(
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
                <Sprout size={21} />
            </div>

            <div className="hidden sm:block">
                <h1 className="text-base font-bold text-slate-900">
                    Assaman-Suuf
                </h1>
                <p className="text-[11px] text-slate-500">
                    Intelligence agro-climatique
                </p>
            </div>
        </div>
    )

}

const DashBoardHeaderSearchButton=()=>{
    return (
        <></>
    )
}
function DashboardHeader({ onOpenSearch }) {
    return (
        <header className="absolute left-0 right-0 top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                {/*<DashBoardHeaderIcon/>*/}
                <button
                    onClick={onOpenSearch}
                    className="ml-2 flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition hover:bg-white md:mx-auto md:max-w-xl"
                >
                    <Search size={17} />
                    <span className="truncate">
            Rechercher une région, une commune, une culture...
          </span>
                </button>

                <div className="flex items-center gap-1">
                    <button className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100">
                        <Bell size={19} />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                    </button>

                    <button className="hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100 sm:flex">
                        <Settings size={19} />
                    </button>

                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                        <UserRound size={19} />
                    </button>
                </div>
            </div>
        </header>
    );
}


export default DashboardHeader;