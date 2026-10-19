import { COULEUR_HACHURES, COULEUR_SANS_DONNEE, ID_MOTIF_HACHURES } from "../../config/mapIndicators";

/** Motif hachuré « Pas de donnée », référencé par fill="url(#…)" depuis les polygones SVG de Leaflet. */
export default function HachuresDefs() {
    return (
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
            <defs>
                <pattern id={ID_MOTIF_HACHURES} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="8" height="8" fill={COULEUR_SANS_DONNEE} />
                    <line x1="0" y1="0" x2="0" y2="8" stroke={COULEUR_HACHURES} strokeWidth="2" />
                </pattern>
            </defs>
        </svg>
    );
}
