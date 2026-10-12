import DashboardMap from "./DashboardMap";
import DashboardDataVisualisation from "./DashboardDataVisualisation.tsx"
import DashboardApiRun from "./DashboardApiRun.tsx";
import DashboardPredictionInterface from "./DashboardPredictionInterface.tsx";

function DashboardMain() {
    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-slate-100 text-slate-900">
            <DashboardMap />
            <DashboardApiRun/>
            <DashboardDataVisualisation/>
            <DashboardPredictionInterface/>
        </main>


    );
}

export default DashboardMain;