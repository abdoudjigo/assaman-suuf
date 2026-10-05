SELECT *
FROM {{ ref('fct_agriculture') }}
WHERE superficie_ha < 0
   OR production_t < 0
   OR rendement_t_ha < 0
