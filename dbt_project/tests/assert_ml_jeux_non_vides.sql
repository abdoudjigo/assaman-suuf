{{ config(severity='warn') }}

-- Doit retourner 0 ligne : les jeux train et test doivent tous deux
-- contenir des campagnes. Si ml_annee_fin_train est mal réglée,
-- tout part en train sans erreur visible.

WITH jeux AS (

    SELECT 'train' AS jeu
    UNION ALL
    SELECT 'test'
)

SELECT j.jeu
FROM jeux AS j
LEFT JOIN {{ ref('ml_rendement_campagne') }} AS m
    ON j.jeu = m.jeu
GROUP BY j.jeu
HAVING COUNT(m.observation_id) = 0
