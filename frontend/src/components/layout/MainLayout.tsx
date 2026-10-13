import Header from "./Header";
import Footer from "./Footer.tsx";

const MainLayout = () => {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}

            <div className="flex flex-1 flex-col">
                <Header
                    title="Dashboard"
                    subtitle="Vue générale de la plateforme agroclimatique"
                />

                <main className="flex-1 bg-gray-50 p-6">
                    {/* Contenu de la page */}
                </main>

                <Footer/>
            </div>
        </div>
    );
};

export default MainLayout;