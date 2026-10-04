SELECT
    MD5(
        CONCAT_WS('|',
            COALESCE(id::VARCHAR, ''),
            COALESCE(station, ''),
            COALESCE(annee::VARCHAR, ''),
            COALESCE(mois::VARCHAR, '')
        )
    ) AS observation_id,

    MD5(station) AS station_key,
    annee AS annee_key,
    mois,
    tavg,
    tmin,
    tmax,
    prcp_mm,
    nb_jours

FROM {{ ref('stg_climat') }}
