-- Mart agricole annuel par région :
-- agrège les observations agricoles selon la région et l'année de récolte.

SELECT
    z.region,
    f.annee_recolte AS annee,

    SUM(f.production_t) AS production_totale_t,
    SUM(f.superficie_ha) AS superficie_totale_ha,
    AVG(f.rendement_t_ha) AS rendement_moyen_t_ha,

    COUNT(*) AS nombre_observations

FROM {{ ref('fct_agriculture') }} AS f

INNER JOIN {{ ref('dim_zone') }} AS z
    ON f.zone_key = z.zone_key

GROUP BY
    z.region,
    f.annee_recolte
