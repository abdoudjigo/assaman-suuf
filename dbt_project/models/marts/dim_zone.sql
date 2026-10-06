-- Dimension zone :
-- une zone représente une région.
-- Elle est commune aux données agricoles et climatiques.

SELECT DISTINCT
    MD5(region) AS zone_key,
    region

FROM {{ ref('int_agriculture') }}

WHERE region IS NOT NULL
