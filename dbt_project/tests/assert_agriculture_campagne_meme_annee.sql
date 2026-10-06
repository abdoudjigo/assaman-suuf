{{ config(severity='warn') }}

-- Doit retourner 0 ligne : int_agroclimat suppose qu'aucune campagne
-- ne traverse deux années civiles (filtre mois BETWEEN semis ET récolte
-- sur l'année de récolte). Si ce test remonte des lignes, ces campagnes
-- n'obtiennent pas de climat et le modèle doit être adapté.
SELECT *
FROM {{ ref('int_agriculture') }}
WHERE annee_semis IS NOT NULL
  AND annee_recolte IS NOT NULL
  AND annee_semis <> annee_recolte
