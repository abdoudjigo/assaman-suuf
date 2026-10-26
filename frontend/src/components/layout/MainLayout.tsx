
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#f8faf6] text-slate-900">
      {/* En-tête commun du dashboard */}
      <Header
        title="Assaman-Suuf"
        subtitle="Suivi agroclimatique et aide à la décision"
        userName="Administrateur"
        organization="DATAFLOW360"
        notificationCount={3}
      />

      {/* Contenu de la page active */}
      <main className="w-full flex-1">
        <Outlet />
      </main>

      {/* Pied de page commun */}
      <Footer />
    </div>
  );
}

export default MainLayout;
