SELECT
    MD5(
        CONCAT_WS('|',
            COALESCE(source_system, ''),
            COALESCE(fnid, ''),
            COALESCE(produit, ''),
            COALESCE(saison, ''),
            COALESCE(annee_semis::VARCHAR, ''),
            COALESCE(annee_recolte::VARCHAR, ''),
            COALESCE(mois_semis::VARCHAR, ''),
            COALESCE(mois_recolte::VARCHAR, ''),
            COALESCE(systeme_production, ''),
            COALESCE(indicateur_qualite::VARCHAR, ''),
            COALESCE(superficie_ha::VARCHAR, ''),
            COALESCE(production_t::VARCHAR, ''),
            COALESCE(rendement_t_ha::VARCHAR, '')
        )
    ) AS observation_id,

    MD5(fnid) AS zone_key,
    MD5(produit) AS produit_key,
    annee_reference AS annee_key,

    fnid,
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

    source_system

FROM {{ ref('int_agriculture') }}
