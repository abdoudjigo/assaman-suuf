-- Doit retourner 0 ligne : fct_agroclimat_campagne doit avoir exactement
-- autant de lignes que fct_agriculture. Le LEFT JOIN vers le climat
-- ne doit ni perdre ni dupliquer de campagne.

WITH comptes AS (

    SELECT
        (SELECT COUNT(*) FROM {{ ref('fct_agriculture') }}) AS nb_agriculture,
        (SELECT COUNT(*) FROM {{ ref('fct_agroclimat_campagne') }}) AS nb_agroclimat
)

SELECT *
FROM comptes
WHERE nb_agriculture <> nb_agroclimat
