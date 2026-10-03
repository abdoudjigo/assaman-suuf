SELECT
    id::INTEGER            AS id,
    TRIM(station)                      AS station,
    TRIM(station_nom)                  AS station_nom,
    annee::INTEGER         AS annee,
    mois::INTEGER          AS mois,
    tavg::FLOAT            AS tavg,
    tmin::FLOAT            AS tmin,
    tmax::FLOAT            AS tmax,
    prcp_mm::FLOAT         AS prcp_mm,
    nb_jours::INTEGER      AS nb_jours
FROM {{ source('raw', 'raw_airbyte_climat') }}
