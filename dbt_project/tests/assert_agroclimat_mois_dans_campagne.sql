-- Doit retourner 0 ligne : chaque mois climatique rattaché à une campagne
-- doit tomber l'année de récolte, entre le mois de semis et celui de récolte.
SELECT *
FROM {{ ref('int_agroclimat') }}
WHERE annee_climatique <> annee_recolte
   OR mois_climatique < mois_semis
   OR mois_climatique > mois_recolte
