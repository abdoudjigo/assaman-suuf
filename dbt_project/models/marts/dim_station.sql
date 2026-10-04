SELECT DISTINCT
    MD5(station) AS station_key,
    station,
    station_nom
FROM {{ ref('stg_climat') }}
WHERE station IS NOT NULL
