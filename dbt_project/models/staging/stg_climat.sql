SELECT
    id::INTEGER              AS id,
    TRIM(station)            AS station,
    TRIM(station_nom)        AS station_nom,
    TRY_CAST(annee AS INTEGER)       AS annee,
    TRY_CAST(mois AS INTEGER)        AS mois,
    TRY_CAST(tavg AS FLOAT)          AS tavg,
    TRY_CAST(tmin AS FLOAT)          AS tmin,
    TRY_CAST(tmax AS FLOAT)          AS tmax,
    TRY_CAST(prcp_mm AS FLOAT)       AS prcp_mm,
    TRY_CAST(nb_jours AS INTEGER)    AS nb_jours
FROM {{ source('raw', 'raw_airbyte_climat') }}
