SELECT DISTINCT
    MD5(produit) AS produit_key,
    produit
FROM {{ ref('int_agriculture') }}
WHERE produit IS NOT NULL
