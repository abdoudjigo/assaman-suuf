SELECT
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
    rendement_t_ha,
    'POSTGRES' AS source_system,
    COALESCE(annee_recolte, annee_semis) AS annee_reference
FROM {{ ref('stg_postgres_agriculture') }}

UNION ALL

SELECT
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
    rendement_t_ha,
    'MONGO' AS source_system,
    COALESCE(annee_recolte, annee_semis) AS annee_reference
FROM {{ ref('stg_mongo_agriculture') }}

UNION ALL

SELECT
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
    rendement_t_ha,
    'KAFKA' AS source_system,
    COALESCE(annee_recolte, annee_semis) AS annee_reference
FROM {{ ref('stg_kafka_agriculture') }}
