SELECT *
FROM {{ ref('fct_agriculture') }}
WHERE (mois_semis IS NOT NULL AND (mois_semis < 1 OR mois_semis > 12))
   OR (mois_recolte IS NOT NULL AND (mois_recolte < 1 OR mois_recolte > 12))
