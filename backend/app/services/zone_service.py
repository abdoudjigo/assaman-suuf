import json
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.zone import Zone


VALID_LEVELS = {"region", "department", "commune"}


def list_zones(
    db: Session,
    level: str,
    parent_id: int | None = None,
) -> list[Zone]:
    if level not in VALID_LEVELS:
        raise ValueError("Niveau géographique invalide.")

    statement = select(Zone).where(Zone.level == level)

    if parent_id is not None:
        statement = statement.where(
            Zone.parent_id == parent_id
        )

    statement = statement.order_by(Zone.name.asc())

    return list(db.scalars(statement).all())


def get_zone(db: Session, zone_id: int) -> Zone | None:
    return db.get(Zone, zone_id)


def search_zones(
    db: Session,
    query: str,
    level: str | None = None,
    limit: int = 20,
) -> list[Zone]:
    statement = select(Zone).where(
        Zone.name.ilike(f"%{query.strip()}%")
    )

    if level is not None:
        if level not in VALID_LEVELS:
            raise ValueError("Niveau géographique invalide.")

        statement = statement.where(Zone.level == level)

    statement = statement.order_by(Zone.name.asc()).limit(limit)

    return list(db.scalars(statement).all())


def zones_to_geojson(
    db: Session,
    level: str,
    parent_id: int | None = None,
) -> dict[str, Any]:
    if level not in VALID_LEVELS:
        raise ValueError("Niveau géographique invalide.")

    geometry_json = func.ST_AsGeoJSON(
        Zone.geometry
    ).label("geometry_json")

    statement = select(
        Zone.id,
        Zone.code,
        Zone.name,
        Zone.level,
        Zone.parent_id,
        Zone.properties,
        geometry_json,
    ).where(
        Zone.level == level,
        Zone.geometry.is_not(None),
    )

    if parent_id is not None:
        statement = statement.where(
            Zone.parent_id == parent_id
        )

    statement = statement.order_by(Zone.name.asc())

    features = []

    for row in db.execute(statement):
        if not row.geometry_json:
            continue

        properties = dict(row.properties or {})
        properties.update(
            {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "level": row.level,
                "parent_id": row.parent_id,
            }
        )

        features.append(
            {
                "type": "Feature",
                "id": row.id,
                "geometry": json.loads(row.geometry_json),
                "properties": properties,
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
    }