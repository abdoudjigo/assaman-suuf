{{ config(severity='warn') }}

-- Doit retourner 0 ligne : une récolte ne peut pas précéder le semis.
SELECT *
FROM {{ ref('int_agriculture') }}
WHERE annee_semis > annee_recolte
   OR (annee_semis = annee_recolte AND mois_semis > mois_recolte)
