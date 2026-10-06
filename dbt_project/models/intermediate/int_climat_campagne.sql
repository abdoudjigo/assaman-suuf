-- Climat d'une campagne : une ligne par campagne agricole
-- ayant au moins un mois climatique disponible.
-- Les stations d'une même région sont d'abord moyennées mois par mois,
-- pour qu'une région à deux stations ne compte pas sa pluie deux fois.

WITH climat_mensuel AS (

    SELECT
        agriculture_observation_id,
        zone_key,
        mois_climatique,

        AVG(tavg)    AS tavg,
        MIN(tmin)    AS tmin,
        MAX(tmax)    AS tmax,
        AVG(prcp_mm) AS prcp_mm

    FROM {{ ref('int_agroclimat') }}

    GROUP BY
        agriculture_observation_id,
        zone_key,
        mois_climatique
),

avec_normales AS (

    SELECT
        c.*,
        n.prcp_mm_normale,
        n.tavg_normale

    FROM climat_mensuel AS c

    LEFT JOIN {{ ref('int_climat_normales') }} AS n
        ON c.zone_key = n.zone_key
       AND c.mois_climatique = n.mois
)

SELECT
    agriculture_observation_id,

    COUNT(*)                 AS nb_mois_climat,
    COUNT(prcp_mm)           AS nb_mois_pluie_mesuree,

    SUM(prcp_mm)             AS pluie_cumul_mm,
    MAX(prcp_mm)             AS pluie_mois_max_mm,
    COUNT_IF(prcp_mm < 10)   AS nb_mois_secs,

    AVG(tavg)                AS tavg_moyenne,
    MAX(tmax)                AS tmax_max,
    MIN(tmin)                AS tmin_min,

    -- Anomalies : seuls les mois mesurés sont comparés à leur normale.
    SUM(prcp_mm - prcp_mm_normale) AS pluie_anomalie_mm,
    AVG(tavg - tavg_normale)       AS tavg_anomalie

FROM avec_normales

GROUP BY agriculture_observation_id
