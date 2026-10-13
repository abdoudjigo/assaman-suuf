import {
    Bell,
    Ellipsis,
    Settings,
    UserRound,
} from "lucide-react";

interface LogControlOptionsProps {
    onHandleUserProfile: () => void;
    onHandleUserSettings: () => void;
    onHandleUserBells: () => void;
    onHandleUserOthersOptions: () => void;
}

export default function LogControlOptions({
    onHandleUserProfile,
    onHandleUserSettings,
    onHandleUserBells,
    onHandleUserOthersOptions,
}: LogControlOptionsProps) {
    const sizeIcon = 18;

    const buttonClass =
        "flex h-11 w-11 items-center justify-center " +
        "rounded-xl border border-slate-200 bg-white/95 " +
        "text-slate-700 shadow-lg backdrop-blur transition " +
        "hover:bg-slate-50 hover:text-green-700 " +
        "focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-green-500";

    return (
        <div className="relative right-4 top-20 z-30 flex flex-col gap-2">
            <button
                type="button"
                onClick={onHandleUserProfile}
                title="Profil utilisateur"
                aria-label="Ouvrir le profil utilisateur"
                className={buttonClass}
            >
                <UserRound size={sizeIcon} />
            </button>

            <button
                type="button"
                onClick={onHandleUserSettings}
                title="Paramètres"
                aria-label="Ouvrir les paramètres"
                className={buttonClass}
            >
                <Settings size={sizeIcon} />
            </button>

            <button
                type="button"
                onClick={onHandleUserBells}
                title="Notifications"
                aria-label="Ouvrir les notifications"
                className={buttonClass}
            >
                <Bell size={sizeIcon} />
            </button>

            <button
                type="button"
                onClick={onHandleUserOthersOptions}
                title="Autres options"
                aria-label="Afficher les autres options"
                className={buttonClass}
            >
                <Ellipsis size={sizeIcon} />
            </button>
        </div>
    );
}

