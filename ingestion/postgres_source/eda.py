import psycopg2
import pandas as pd

# Connexion à PostgreSQL
connexion = psycopg2.connect(
    host="localhost",
    port="5432",
    database="dataflow360_source_2",
    user="postgres",
    password="nkm"
)

print("Connexion PostgreSQL réussie ✅")

# Récupération des données
requete = """
SELECT *
FROM agriculture_production;
"""

df = pd.read_sql_query(requete, connexion)

# Fermer la connexion
connexion.close()

#==================================================
# 1. INFORMATIONS SUR LES DONNÉES
#==================================================

print(f"Nombre de lignes : {len(df)}")
print(f"Nombre de colonnes : {len(df.columns)}")

print("\nAperçu des données :")
print(df.head())

print("\n" + "=" * 50)
print("1. INFORMATIONS SUR LES DONNÉES")
print("=" * 50)

print(df.info())

#==================================================
# 2. VALEURS MANQUANTES
#==================================================

print("\n" + "=" * 50)
print("2. VALEURS MANQUANTES")
print("=" * 50)

print(df.isnull().sum())

#==================================================
# 3. STATISTIQUES DES VARIABLES NUMÉRIQUES
#==================================================

print("\n" + "=" * 50)
print("3. STATISTIQUES DES VARIABLES NUMÉRIQUES")
print("=" * 50)

print(df.describe())

#==================================================
# 4. PRODUITS
#==================================================

print("\n" + "=" * 50)
print("4. PRODUITS")
print("=" * 50)

print(df["produit"].value_counts())

#==================================================
# 5. RÉGIONS
#==================================================

print("\n" + "=" * 50)
print("5. RÉGIONS")
print("=" * 50)

print(df["region"].value_counts())

#==================================================
# 6. DOUBLONS
#==================================================

print("\n" + "=" * 50)
print("6. DOUBLONS")
print("=" * 50)

doublons = df.duplicated().sum()

print(f"Nombre de lignes dupliquées : {doublons}")

#==================================================
# 7. VALEURS ABERRANTES
#==================================================

print("\n" + "=" * 50)
print("7. VALEURS ABERRANTES")
print("=" * 50)

colonnes = [
    "superficie_ha",
    "production_t",
    "rendement_t_ha"
]

for colonne in colonnes:
    print(f"\n--- {colonne} ---")
    print(f"Minimum : {df[colonne].min()}")
    print(f"Maximum : {df[colonne].max()}")
    print(f"Médiane : {df[colonne].median()}")

#==================================================
# 8. COHÉRENCE DU RENDEMENT
#==================================================    

print("\n" + "=" * 50)
print("8. COHÉRENCE DU RENDEMENT")
print("=" * 50)

# Calcul du rendement à partir de la production et de la superficie
df["rendement_calcule"] = (
    df["production_t"] / df["superficie_ha"]
)

# Écart entre le rendement fourni et le rendement calculé
df["ecart_rendement"] = (
    df["rendement_t_ha"] - df["rendement_calcule"]
)

# Lignes suffisamment complètes pour effectuer la comparaison
comparaison = df[
    df["superficie_ha"].notna()
    & df["production_t"].notna()
    & df["rendement_t_ha"].notna()
]

print(f"Nombre de lignes comparées : {len(comparaison)}")

print(
    f"Écart maximum : "
    f"{comparaison['ecart_rendement'].abs().max()}"
)

# On considère ici une petite tolérance liée aux nombres décimaux
incoherentes = comparaison[
    comparaison["ecart_rendement"].abs() > 0.000001
]

print(f"Lignes potentiellement incohérentes : {len(incoherentes)}")

#==================================================
# 9. DÉTECTION DES VALEURS POTENTIELLEMENT ABERRANTES
#==================================================

print("\n" + "=" * 50)
print("9. DÉTECTION DES VALEURS POTENTIELLEMENT ABERRANTES")
print("=" * 50)

colonnes = [
    "superficie_ha",
    "production_t",
    "rendement_t_ha"
]

for colonne in colonnes:

    donnees = df[colonne].dropna()

    Q1 = donnees.quantile(0.25)
    Q3 = donnees.quantile(0.75)

    IQR = Q3 - Q1

    borne_inferieure = Q1 - 1.5 * IQR
    borne_superieure = Q3 + 1.5 * IQR

    aberrantes = donnees[
        (donnees < borne_inferieure)
        | (donnees > borne_superieure)
    ]

    print(f"\n--- {colonne} ---")
    print(f"Q1 : {Q1}")
    print(f"Q3 : {Q3}")
    print(f"IQR : {IQR}")
    print(f"Borne inférieure : {borne_inferieure}")
    print(f"Borne supérieure : {borne_superieure}")
    print(f"Nombre de valeurs potentiellement aberrantes : {len(aberrantes)}")

#==================================================
# 10. RENDEMENT PAR PRODUIT
#==================================================    

print("\n" + "=" * 50)
print("10. RENDEMENT PAR PRODUIT")
print("=" * 50)

resume_produits = (
    df.groupby("produit")["rendement_t_ha"]
    .agg(
        nombre="count",
        moyenne="mean",
        mediane="median",
        minimum="min",
        maximum="max"
    )
    .round(3)
)

print(resume_produits)

#==================================================
# 11. VALEURS MANQUANTES PAR PRODUIT
#==================================================

print("\n" + "=" * 50)
print("11. VALEURS MANQUANTES PAR PRODUIT")
print("=" * 50)

manquants_produit = (
    df.groupby("produit")
    .agg(
        observations=("produit", "size"),
        superficie_manquante=("superficie_ha", lambda x: x.isna().sum()),
        production_manquante=("production_t", lambda x: x.isna().sum()),
        rendement_manquant=("rendement_t_ha", lambda x: x.isna().sum())
    )
)

print(manquants_produit)

#==================================================
# 12. RENDEMENTS MANQUANTS RÉCUPÉRABLES
#==================================================

print("\n" + "=" * 50)
print("12. RENDEMENTS MANQUANTS RÉCUPÉRABLES")
print("=" * 50)

rendement_manquant = df["rendement_t_ha"].isna()

rendement_recalculable = (
    rendement_manquant
    & df["superficie_ha"].notna()
    & df["production_t"].notna()
)

print(
    "Rendements manquants :",
    rendement_manquant.sum()
)

print(
    "Rendements pouvant être recalculés :",
    rendement_recalculable.sum()
)

print(
    "Rendements non recalculables :",
    (
        rendement_manquant
        & ~rendement_recalculable
    ).sum()
)

#==================================================
# 13. DOUBLONS MÉTIER
#==================================================

print("\n" + "=" * 50)
print("13. DOUBLONS MÉTIER")
print("=" * 50)

cles_metier = [
    "region",
    "departement",
    "produit",
    "saison",
    "annee_semis"
]

doublons_metier = df.duplicated(
    subset=cles_metier,
    keep=False
)

print(
    "Nombre de lignes appartenant à un groupe potentiellement dupliqué :",
    doublons_metier.sum()
)

print(
    "Nombre de groupes concernés :",
    df.loc[doublons_metier, cles_metier]
      .drop_duplicates()
      .shape[0]
)

#==================================================
# 14. CONTRÔLE DES VALEURS NUMÉRIQUES
#==================================================

print("\n" + "=" * 50)
print("14. CONTRÔLE DES VALEURS NUMÉRIQUES")
print("=" * 50)

print("\nAnnées de semis :")
print(df["annee_semis"].describe())

print("\nAnnées de récolte :")
print(df["annee_recolte"].describe())

print("\nMois de semis :")
print(df["mois_semis"].unique())

print("\nMois de récolte :")
print(df["mois_recolte"].unique())

print("\nSuperficie minimale :", df["superficie_ha"].min())
print("Production minimale :", df["production_t"].min())
print("Rendement minimal :", df["rendement_t_ha"].min())

#==================================================
# 15. COHÉRENCE ENTRE SEMIS ET RÉCOLTE
#==================================================

print("\n" + "=" * 50)
print("15. COHÉRENCE ENTRE SEMIS ET RÉCOLTE")
print("=" * 50)

incoherences_dates = df[
    df["annee_recolte"] < df["annee_semis"]
]

print(
    "Nombre de lignes avec une année de récolte antérieure à l'année de semis :",
    len(incoherences_dates)
)

if len(incoherences_dates) > 0:
    print("\nLignes concernées :")
    print(
        incoherences_dates[
            [
                "region",
                "departement",
                "produit",
                "saison",
                "annee_semis",
                "annee_recolte"
            ]
        ].head(10)
    )
else:
    print("Aucune incohérence temporelle détectée.")

#==================================================
# 16. VALEURS MANQUANTES PAR RÉGION
#==================================================

print("\n" + "=" * 50)
print("16. VALEURS MANQUANTES PAR RÉGION")
print("=" * 50)

manquants_region = df.groupby("region").agg(
    observations=("region", "size"),
    superficie_manquante=("superficie_ha", lambda x: x.isna().sum()),
    production_manquante=("production_t", lambda x: x.isna().sum()),
    rendement_manquant=("rendement_t_ha", lambda x: x.isna().sum())
)

print(manquants_region)

#==================================================
# 17. DÉTAIL DES VALEURS MANQUANTES
#==================================================

print("\n" + "=" * 50)
print("17. DÉTAIL DES VALEURS MANQUANTES")
print("=" * 50)

colonnes_analyse = [
    "region",
    "departement",
    "produit",
    "saison",
    "annee_semis",
    "annee_recolte",
    "superficie_ha",
    "production_t",
    "rendement_t_ha"
]

lignes_manquantes = df[
    df["superficie_ha"].isna()
    | df["production_t"].isna()
    | df["rendement_t_ha"].isna()
]

print("Nombre de lignes concernées :", len(lignes_manquantes))

print("\nObservations concernées :")
print(
    lignes_manquantes[colonnes_analyse]
    .to_string(index=False)
)

#==================================================
# 18. SYNTHÈSE DE LA COHÉRENCE DU RENDEMENT
#==================================================

print("\n" + "=" * 50)
print("18. SYNTHÈSE DE LA COHÉRENCE DU RENDEMENT")
print("=" * 50)

comparaison = df[
    df["superficie_ha"].notna()
    & df["production_t"].notna()
    & df["rendement_t_ha"].notna()
].copy()

comparaison["rendement_calcule"] = (
    comparaison["production_t"] / comparaison["superficie_ha"]
)

comparaison["ecart"] = (
    comparaison["rendement_t_ha"]
    - comparaison["rendement_calcule"]
)

print("Nombre d'observations complètes :", len(comparaison))

print(
    "Écart absolu maximal :",
    comparaison["ecart"].abs().max()
)

print(
    "Nombre d'observations incohérentes :",
    (comparaison["ecart"].abs() > 0.000001).sum()
)