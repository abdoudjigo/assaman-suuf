{{ config(severity='warn') }}

-- Doit retourner 0 ligne : chaque jeu (train, test) doit contenir
-- des campagnes avec ET sans climat. Sinon, les métriques de test
-- ne mesureraient qu'un seul des deux cas (climat mesuré ou imputé).

SELECT
    jeu,
    COUNT_IF(a_climat)     AS nb_avec_climat,
    COUNT_IF(NOT a_climat) AS nb_sans_climat

FROM {{ ref('ml_rendement_campagne') }}

GROUP BY jeu

HAVING COUNT_IF(a_climat) = 0
    OR COUNT_IF(NOT a_climat) = 0
