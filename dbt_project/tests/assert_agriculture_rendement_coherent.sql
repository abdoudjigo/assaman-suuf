{{ config(severity='warn') }}

-- Doit retourner 0 ligne : le rendement doit correspondre à
-- production / superficie, à 10 % près (arrondis des sources).
SELECT
    *,
    production_t / superficie_ha AS rendement_calcule
FROM {{ ref('int_agriculture') }}
WHERE superficie_ha > 0
  AND production_t IS NOT NULL
  AND rendement_t_ha IS NOT NULL
  AND ABS(rendement_t_ha - production_t / superficie_ha)
      > 0.1 * GREATEST(rendement_t_ha, production_t / superficie_ha)
