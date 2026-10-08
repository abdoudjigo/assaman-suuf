import { Search, Bell, UserCircle } from "lucide-react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

const Header = ({
                    title = "Dashboard",
                    subtitle = "Vue générale de la plateforme agroclimatique",
                }: HeaderProps) => {
    return (
        <header className="flex h-20 items-center justify-between border-b bg-white px-6">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    {title}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    {subtitle}
                </p>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="h-10 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                    />
                </div>

                {/* Notifications */}
                <button
                    type="button"
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
                    aria-label="Notifications"
                >
                    <Bell size={20} />

                    {/* Notification indicator */}
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                </button>

                {/* User */}
                <button
                    type="button"
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
                >
                    <UserCircle size={36} className="text-gray-500" />

                    <div className="hidden text-left md:block">
                        <p className="text-sm font-medium text-gray-900">
                            Administrateur
                        </p>

                        <p className="text-xs text-gray-500">
                            DATAFLOW360
                        </p>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;