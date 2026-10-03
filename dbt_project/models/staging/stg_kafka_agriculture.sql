SELECT
    RECORD_CONTENT:fnid::VARCHAR AS fnid,
    RECORD_CONTENT:region::VARCHAR AS region,
    RECORD_CONTENT:departement::VARCHAR AS departement,
    RECORD_CONTENT:produit::VARCHAR AS produit,
    RECORD_CONTENT:saison::VARCHAR AS saison,
    RECORD_CONTENT:annee_semis::INTEGER AS annee_semis,
    RECORD_CONTENT:mois_semis::INTEGER AS mois_semis,
    RECORD_CONTENT:annee_recolte::INTEGER AS annee_recolte,
    RECORD_CONTENT:mois_recolte::INTEGER AS mois_recolte,

    CASE
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            IN ('none', 'pluvial')
            THEN 'Pluvial'
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            = 'irrigué'
            THEN 'Irrigué'
        WHEN LOWER(TRIM(RECORD_CONTENT:systeme_production::VARCHAR))
            LIKE 'décrue%'
            THEN 'Décrue (PS)'
        ELSE NULL
    END AS systeme_production,

    RECORD_CONTENT:indicateur_qualite::INTEGER AS indicateur_qualite,
    TRY_CAST(RECORD_CONTENT:superficie_ha::VARCHAR AS FLOAT) AS superficie_ha,
    TRY_CAST(RECORD_CONTENT:production_t::VARCHAR AS FLOAT) AS production_t,
    TRY_CAST(RECORD_CONTENT:rendement_t_ha::VARCHAR AS FLOAT) AS rendement_t_ha

FROM {{ source('raw', 'raw_kafka_agriculture') }}
