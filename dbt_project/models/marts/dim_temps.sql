-- Dimension temps :
-- contient les couples année/mois réellement présents dans les données climatiques.

SELECT DISTINCT
    (annee * 100 + mois) AS date_key,
    annee,
    mois,
    MONTHNAME(DATE_FROM_PARTS(annee, mois, 1)) AS nom_mois,
    QUARTER(DATE_FROM_PARTS(annee, mois, 1)) AS trimestre
FROM {{ ref('stg_climat') }}
WHERE annee IS NOT NULL
  AND mois IS NOT NULL