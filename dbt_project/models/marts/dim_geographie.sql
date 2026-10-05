-- Dimension géographique :
-- regroupe chaque FNID avec son département et sa région.
-- Elle permet d'analyser les données agricoles par zone géographique.

SELECT DISTINCT
    MD5(fnid) AS geographie_key,
    fnid,
    departement,
    region
FROM {{ ref('int_agriculture') }}
WHERE fnid IS NOT NULL
