import dlt
import psycopg2


def agriculture_production():
    connexion = psycopg2.connect(
        host="localhost",
        port="5432",
        database="dataflow360_source_2",
        user="postgres",
        password="nkm"
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
    pipeline_name="postgres_agriculture",
    destination="duckdb",
    dataset_name="agriculture_data"
)


load_info = pipeline.run(
    agriculture_production(),
    table_name="agriculture_production",
    write_disposition="replace"
)

print(load_info)

