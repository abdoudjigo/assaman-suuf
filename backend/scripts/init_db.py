from sqlalchemy import text

from app.db.session import Base, engine
from app.models.zone import Zone  # noqa: F401


def init_database() -> None:
    with engine.begin() as connection:
        connection.execute(
            text("CREATE EXTENSION IF NOT EXISTS postgis")
        )

    Base.metadata.create_all(bind=engine)

    print("Initialisation de la base terminée.")
    print("Extension PostGIS et tables vérifiées.")


if __name__ == "__main__":
    init_database()