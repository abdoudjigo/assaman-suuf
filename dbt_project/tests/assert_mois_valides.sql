-- Doit retourner 0 ligne : tout mois hors de [1, 12] est une anomalie.
SELECT *
FROM {{ ref('int_agriculture') }}
WHERE (mois_semis IS NOT NULL AND (mois_semis < 1 OR mois_semis > 12))
   OR (mois_recolte IS NOT NULL AND (mois_recolte < 1 OR mois_recolte > 12))