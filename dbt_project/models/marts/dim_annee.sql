SELECT DISTINCT
    annee AS annee_key
FROM (
    SELECT annee_reference AS annee
    FROM {{ ref('int_agriculture') }}

    UNION ALL

    SELECT annee
    FROM {{ ref('stg_climat') }}
)
WHERE annee IS NOT NULL
