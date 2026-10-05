-- Fait climatique :
-- une ligne représente une station pour une année et un mois.
-- La clé date_key permet de relier l'observation à la dimension temps.

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

    (annee * 100 + mois) AS date_key,

    tavg,
    tmin,
    tmax,
    prcp_mm,
    nb_jours

FROM {{ ref('stg_climat') }}