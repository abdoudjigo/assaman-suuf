-- Doit retourner 0 ligne : superficie, production et rendement ne peuvent pas être négatifs.
SELECT *
FROM {{ ref('int_agriculture') }}
WHERE superficie_ha < 0
   OR production_t < 0
   OR rendement_t_ha < 0