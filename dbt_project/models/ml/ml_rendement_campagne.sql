-- Jeu d'entraînement : une ligne par campagne ayant un rendement,
-- avec ou sans climat. Le climat manquant (a_climat = FALSE) reste NULL
-- et sera imputé en Python.
-- production_t est volontairement absente (fuite : rendement = production / superficie).

WITH historique AS (

    -- Rendement d'une unité (zone, produit, saison, système) pour une année donnée.
    SELECT
        fnid,
        produit_key,
        saison,
        systeme_production,
        annee_recolte,
        AVG(rendement_t_ha) AS rendement_t_ha

    FROM {{ ref('fct_agriculture') }}

    WHERE rendement_t_ha > 0

    GROUP BY
        fnid,
        produit_key,
        saison,
        systeme_production,
        annee_recolte
)

SELECT
    -- Identifiants : pour tracer les prédictions, pas pour apprendre.
    a.observation_id,
    a.fnid,
    a.annee,

    -- Features : campagne.
    p.produit,
    z.region,
    a.saison,
    a.systeme_production,
    a.mois_semis,
    a.mois_recolte,
    a.duree_campagne_mois,
    a.superficie_ha,

    -- Features : climat (NULL si a_climat = FALSE, imputées en Python).
    a.a_climat,
    a.pluie_cumul_mm,
    a.pluie_mois_max_mm,
    a.nb_mois_secs,
    a.pluie_anomalie_mm,
    a.tavg_moyenne,
    a.tmax_max,
    a.tmin_min,
    a.tavg_anomalie,
    a.nb_mois_climat,
    a.taux_couverture_climat,

    -- Features : historique.
    h.rendement_t_ha AS rendement_n_1,

    -- Cible.
    a.rendement_t_ha AS cible_rendement_t_ha,

    -- Découpage temporel, aligné sur la période des normales.
    IFF(a.annee <= {{ var('ml_annee_fin_train') }}, 'train', 'test') AS jeu

FROM {{ ref('fct_agroclimat_campagne') }} AS a

INNER JOIN {{ ref('dim_zone') }} AS z
    ON a.zone_key = z.zone_key

INNER JOIN {{ ref('dim_produit') }} AS p
    ON a.produit_key = p.produit_key

LEFT JOIN historique AS h
    ON  h.fnid = a.fnid
    AND h.produit_key = a.produit_key
    AND EQUAL_NULL(h.saison, a.saison)
    AND EQUAL_NULL(h.systeme_production, a.systeme_production)
    AND h.annee_recolte = a.annee - 1

WHERE a.rendement_t_ha > 0
