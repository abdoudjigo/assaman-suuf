SELECT DISTINCT
    MD5(fnid) AS zone_key,
    fnid,
    region,
    departement
FROM {{ ref('int_agriculture') }}
WHERE fnid IS NOT NULL
