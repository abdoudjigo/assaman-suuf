-- Normales climatiques : une ligne par région et par mois.
-- Calculées sur les seules années d'entraînement, pour que le climat
-- des années de test ne fuite pas dans les features.

SELECT
    s.zone_key,
    t.mois,

    AVG(c.prcp_mm) AS prcp_mm_normale,
    AVG(c.tavg)    AS tavg_normale,

    COUNT(DISTINCT t.annee) AS nb_annees_reference

FROM {{ ref('fct_climat') }} AS c

INNER JOIN {{ ref('dim_station') }} AS s
    ON c.station_key = s.station_key

INNER JOIN {{ ref('dim_temps') }} AS t
    ON c.date_key = t.date_key

WHERE t.annee <= {{ var('ml_annee_fin_train') }}

GROUP BY
    s.zone_key,
    t.mois
