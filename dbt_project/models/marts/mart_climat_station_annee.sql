-- Mart climatique annuel :
-- agrège les observations mensuelles par station et par année.

SELECT
    f.station_key,
    t.annee,

    AVG(f.tavg) AS temperature_moyenne,
    MIN(f.tmin) AS temperature_minimale,
    MAX(f.tmax) AS temperature_maximale,
    SUM(f.prcp_mm) AS precipitation_totale_mm,
    SUM(f.nb_jours) AS nombre_jours,

    COUNT(*) AS nombre_observations

FROM {{ ref('fct_climat') }} AS f

INNER JOIN {{ ref('dim_temps') }} AS t
    ON f.date_key = t.date_key

GROUP BY
    f.station_key,
    t.annee