-- Dimension temps :
-- un calendrier mensuel complet couvrant les années
-- des données agricoles et climatiques, même sans relevé.

WITH bornes AS (

    SELECT
        MIN(annee) AS annee_min,
        MAX(annee) AS annee_max
    FROM (
        SELECT annee FROM {{ ref('stg_climat') }}
        UNION ALL
        SELECT annee_reference FROM {{ ref('int_agriculture') }}
    )
),

annees AS (

    SELECT b.annee_min + g.n AS annee
    FROM bornes AS b
    CROSS JOIN (
        SELECT ROW_NUMBER() OVER (ORDER BY SEQ4()) - 1 AS n
        FROM TABLE(GENERATOR(ROWCOUNT => 200))
    ) AS g
    WHERE b.annee_min + g.n <= b.annee_max
),

mois AS (

    SELECT ROW_NUMBER() OVER (ORDER BY SEQ4()) AS mois
    FROM TABLE(GENERATOR(ROWCOUNT => 12))
)

SELECT
    (a.annee * 100 + m.mois) AS date_key,
    a.annee,
    m.mois,

    DECODE(m.mois,
        1, 'Janvier',  2, 'Février',  3, 'Mars',      4, 'Avril',
        5, 'Mai',      6, 'Juin',     7, 'Juillet',   8, 'Août',
        9, 'Septembre', 10, 'Octobre', 11, 'Novembre', 12, 'Décembre'
    ) AS nom_mois,

    QUARTER(DATE_FROM_PARTS(a.annee, m.mois, 1)) AS trimestre,

    -- Saison des pluies au Sénégal : juin à octobre.
    m.mois BETWEEN 6 AND 10 AS est_hivernage

FROM annees AS a
CROSS JOIN mois AS m
