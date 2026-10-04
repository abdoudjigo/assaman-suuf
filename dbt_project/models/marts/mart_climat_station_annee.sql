SELECT
    station_key,
    annee_key,

    AVG(tavg) AS temperature_moyenne,
    MIN(tmin) AS temperature_minimale,
    MAX(tmax) AS temperature_maximale,
    SUM(prcp_mm) AS precipitation_totale_mm,
    SUM(nb_jours) AS nombre_jours,

    COUNT(*) AS nombre_observations

FROM {{ ref('fct_climat') }}

GROUP BY
    station_key,
    annee_key
