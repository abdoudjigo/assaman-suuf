SELECT
    fnid::VARCHAR AS fnid,
    TRIM(region) AS region,
    TRIM(departement) AS departement,
    TRIM(produit) AS produit,
    TRIM(saison) AS saison,
    TRY_CAST(annee_semis AS INTEGER) AS annee_semis,
    TRY_CAST(mois_semis AS INTEGER) AS mois_semis,
    TRY_CAST(annee_recolte AS INTEGER) AS annee_recolte,
    TRY_CAST(mois_recolte AS INTEGER) AS mois_recolte,

    CASE
        WHEN LOWER(TRIM(systeme_production)) IN ('none', 'pluvial')
            THEN 'Pluvial'
        WHEN LOWER(TRIM(systeme_production)) = 'irrigué'
            THEN 'Irrigué'
        WHEN LOWER(TRIM(systeme_production)) LIKE 'décrue%'
            THEN 'Décrue (PS)'
        ELSE NULL
    END AS systeme_production,

    TRY_CAST(indicateur_qualite AS INTEGER) AS indicateur_qualite,
    TRY_CAST(superficie_ha AS FLOAT) AS superficie_ha,
    TRY_CAST(production_t AS FLOAT) AS production_t,
    TRY_CAST(rendement_t_ha AS FLOAT) AS rendement_t_ha
FROM {{ source('raw', 'raw_mongo_agriculture') }}
