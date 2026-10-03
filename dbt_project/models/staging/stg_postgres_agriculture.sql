SELECT
    fnid::VARCHAR AS fnid,
    TRIM(region) AS region,
    TRIM(departement) AS departement,
    TRIM(produit) AS produit,
    TRIM(saison) AS saison,
    annee_semis::INTEGER AS annee_semis,
    mois_semis::INTEGER AS mois_semis,
    annee_recolte::INTEGER AS annee_recolte,
    mois_recolte::INTEGER AS mois_recolte,

    CASE
        WHEN LOWER(TRIM(systeme_production)) IN ('none', 'pluvial')
            THEN 'Pluvial'
        WHEN LOWER(TRIM(systeme_production)) = 'irrigué'
            THEN 'Irrigué'
        WHEN LOWER(TRIM(systeme_production)) LIKE 'décrue%'
            THEN 'Décrue (PS)'
        ELSE NULL
    END AS systeme_production,

    indicateur_qualite::INTEGER AS indicateur_qualite,
    superficie_ha::FLOAT AS superficie_ha,
    production_t::FLOAT AS production_t,
    rendement_t_ha::FLOAT AS rendement_t_ha
FROM {{ source('raw', 'raw_postgres_agriculture') }}
