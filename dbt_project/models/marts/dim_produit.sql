-- Dimension produit :
-- une ligne représente un produit agricole.
-- La catégorie vient du seed seed_produits.

SELECT DISTINCT
    MD5(a.produit) AS produit_key,
    a.produit,
    p.categorie

FROM {{ ref('int_agriculture') }} AS a

LEFT JOIN {{ ref('seed_produits') }} AS p
    ON a.produit = p.produit

WHERE a.produit IS NOT NULL
