
import { Search, Bell, UserCircle, Menu } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  organization?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
}

const Header = ({
  title = "DashboardApiRun",
  subtitle = "Vue générale de la plateforme agroclimatique",
  userName = "Administrateur",
  organization = "DATAFLOW360",
  notificationCount = 1,
  onMenuClick,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      {/* Titre de la page */}
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu size={21} />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 hidden text-sm text-gray-500 sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Recherche */}
        <form
          role="search"
          onSubmit={(event) => event.preventDefault()}
          className="relative hidden md:block"
        >
          <Search
            size={18}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            placeholder="Rechercher..."
            aria-label="Rechercher sur la plateforme"
            className="h-10 w-48 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 lg:w-64"
          />
        </form>

        {/* Notifications */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={`Notifications : ${notificationCount} non lue(s)`}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Profil utilisateur */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:gap-3 sm:px-2"
          aria-label={`Profil de ${userName}`}
        >
          <UserCircle
            size={34}
            strokeWidth={1.5}
            className="shrink-0 text-gray-500"
          />

          <div className="hidden md:block">
            <p className="max-w-36 truncate text-sm font-medium text-gray-900">
              {userName}
            </p>
            <p className="max-w-36 truncate text-xs text-gray-500">
              {organization}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
