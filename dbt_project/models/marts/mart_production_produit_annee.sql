-- Mart agricole annuel par produit :
-- agrège les observations agricoles selon le produit et l'année de récolte.

SELECT
    produit_key,
    annee_recolte AS annee,

    SUM(production_t) AS production_totale_t,
    SUM(superficie_ha) AS superficie_totale_ha,
    AVG(rendement_t_ha) AS rendement_moyen_t_ha,

    COUNT(*) AS nombre_observations

FROM {{ ref('fct_agriculture') }}

GROUP BY
    produit_key,
    annee_recolte