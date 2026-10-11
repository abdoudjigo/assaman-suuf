import argparse
import json
from pathlib import Path

from sqlalchemy import text

from app.db.session import engine


VALID_LEVELS = {"region", "department", "commune"}


def import_geojson(
    file_path: Path,
    level: str,
    name_field: str,
    code_field: str,
    parent_field: str | None,
) -> int:
    if level not in VALID_LEVELS:
        raise ValueError(
            f"Niveau invalide : {level}. "
            f"Valeurs acceptées : {sorted(VALID_LEVELS)}"
        )

    if not file_path.exists():
        raise FileNotFoundError(
            f"Fichier GeoJSON introuvable : {file_path}"
        )

    with file_path.open("r", encoding="utf-8") as file:
        collection = json.load(file)

    if collection.get("type") != "FeatureCollection":
        raise ValueError(
            "Le fichier doit être une GeoJSON FeatureCollection."
        )

    features = collection.get("features", [])
    imported = 0

    statement = text(
        """
        INSERT INTO geographic_zones (
            code,
            name,
            level,
            parent_id,
            properties,
            geometry
        )
        VALUES (
            :code,
            :name,
            :level,
            :parent_id,
            CAST(:properties AS json),
            ST_Multi(
                ST_SetSRID(
                    ST_GeomFromGeoJSON(:geometry),
                    4326
                )
            )
        )
        ON CONFLICT (level, code)
        DO UPDATE SET
            name = EXCLUDED.name,
            parent_id = EXCLUDED.parent_id,
            properties = EXCLUDED.properties,
            geometry = EXCLUDED.geometry
        """
    )

    with engine.begin() as connection:
        for index, feature in enumerate(features, start=1):
            properties = feature.get("properties") or {}
            geometry = feature.get("geometry")

            name = properties.get(name_field)
            code = properties.get(code_field)

            if not name or not code:
                raise ValueError(
                    f"Feature {index} : propriété "
                    f"{name_field!r} ou {code_field!r} absente."
                )

            if not geometry:
                raise ValueError(
                    f"Feature {index} : géométrie absente."
                )

            geometry_type = geometry.get("type")

            if geometry_type not in {"Polygon", "MultiPolygon"}:
                raise ValueError(
                    f"Feature {index} : géométrie "
                    f"{geometry_type!r} non prise en charge."
                )

            parent_id = (
                properties.get(parent_field)
                if parent_field
                else None
            )

            connection.execute(
                statement,
                {
                    "code": str(code),
                    "name": str(name),
                    "level": level,
                    "parent_id": (
                        int(parent_id)
                        if parent_id is not None
                        else None
                    ),
                    "properties": json.dumps(
                        properties,
                        ensure_ascii=False,
                    ),
                    "geometry": json.dumps(geometry),
                },
            )

            imported += 1

    return imported


def main():
    parser = argparse.ArgumentParser(
        description="Importer les limites administratives dans PostGIS."
    )

    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument(
        "--level",
        required=True,
        choices=sorted(VALID_LEVELS),
    )
    parser.add_argument("--name-field", default="name")
    parser.add_argument("--code-field", default="code")
    parser.add_argument("--parent-field", default=None)

    args = parser.parse_args()

    count = import_geojson(
        file_path=args.file,
        level=args.level,
        name_field=args.name_field,
        code_field=args.code_field,
        parent_field=args.parent_field,
    )

    print(
        f"Import terminé : {count} zones de niveau "
        f"{args.level} traitées."
    )


if __name__ == "__main__":
    main()