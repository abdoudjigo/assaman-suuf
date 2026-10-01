import dlt
import os
import psycopg2
from dotenv import load_dotenv


load_dotenv()


def agriculture_production():
    connexion = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT"),
        database=os.getenv("POSTGRES_DATABASE"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD")
)

    try:
        curseur = connexion.cursor()

        curseur.execute("""
            SELECT
                id,
                fnid,
                region,
                departement,
                produit,
                saison,
                annee_semis,
                mois_semis,
                annee_recolte,
                mois_recolte,
                systeme_production,
                indicateur_qualite,
                superficie_ha,
                production_t,
                rendement_t_ha
            FROM agriculture_production;
        """)

        colonnes = [description[0] for description in curseur.description]

        for ligne in curseur:
            donnees = {}

            for colonne, valeur in zip(colonnes, ligne):
                if valeur is None:
                    donnees[colonne] = None
                elif isinstance(valeur, str) and valeur.strip() in ["", "NA", "N/A", "NaN"]:
                    donnees[colonne] = None
                else:
                    donnees[colonne] = valeur

            yield donnees

    finally:
        connexion.close()


pipeline = dlt.pipeline(
    pipeline_name="postgres_agriculture_snowflake",
    destination="snowflake",
    dataset_name=os.getenv("SNOWFLAKE_SCHEMA", "RAW")
)


load_info = pipeline.run(
    agriculture_production(),
    table_name="raw_postgres_agriculture",
    write_disposition="replace"
)

print(load_info)

