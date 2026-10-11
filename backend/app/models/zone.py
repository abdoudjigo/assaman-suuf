from typing import Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Zone(Base):
    __tablename__ = "geographic_zones"

    __table_args__ = (
        UniqueConstraint(
            "level",
            "code",
            name="uq_geographic_zones_level_code",
        ),
        Index("ix_geographic_zones_name", "name"),
        Index("ix_geographic_zones_level", "level"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    level: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("geographic_zones.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    properties: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    geometry: Mapped[Any] = mapped_column(
        Geometry(
            geometry_type="MULTIPOLYGON",
            srid=4326,
            spatial_index=True,
        ),
        nullable=False,
    )