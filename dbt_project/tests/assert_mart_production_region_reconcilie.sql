-- Doit retourner 0 ligne : le mart par région doit reprendre toutes
-- les observations du fait agricole rattachées à une région.
WITH fait AS (
    SELECT
        COUNT(*) AS nb_observations,
        COALESCE(SUM(production_t), 0) AS production_t
    FROM {{ ref('fct_agriculture') }}
    WHERE zone_key IS NOT NULL
),

mart AS (
    SELECT
        COALESCE(SUM(nombre_observations), 0) AS nb_observations,
        COALESCE(SUM(production_totale_t), 0) AS production_t
    FROM {{ ref('mart_production_region_annee') }}
)

SELECT
    fait.nb_observations AS nb_fait,
    mart.nb_observations AS nb_mart,
    fait.production_t AS production_fait,
    mart.production_t AS production_mart
FROM fait
CROSS JOIN mart
WHERE fait.nb_observations <> mart.nb_observations
   OR ABS(fait.production_t - mart.production_t) > 0.001 * GREATEST(1, ABS(fait.production_t))
