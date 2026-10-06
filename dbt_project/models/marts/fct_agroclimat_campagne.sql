-- Fait agroclimatique : une ligne par campagne agricole,
-- avec le résumé du climat observé entre semis et récolte.
-- Toutes les campagnes sont gardées (LEFT JOIN) : a_climat
-- signale celles qui ont un climat.

SELECT
    f.observation_id,

    f.zone_key,
    f.produit_key,
    f.annee_recolte AS annee,

    f.fnid,
    f.saison,
    f.systeme_production,
    f.indicateur_qualite,
    f.source_system,

    f.mois_semis,
    f.mois_recolte,
    f.mois_recolte - f.mois_semis + 1 AS duree_campagne_mois,

    f.superficie_ha,
    f.production_t,
    f.rendement_t_ha,

    c.agriculture_observation_id IS NOT NULL AS a_climat,

    c.nb_mois_climat,
    c.nb_mois_climat / NULLIF(f.mois_recolte - f.mois_semis + 1, 0) AS taux_couverture_climat,

    c.pluie_cumul_mm,
    c.pluie_mois_max_mm,
    c.nb_mois_secs,
    c.pluie_anomalie_mm,

    c.tavg_moyenne,
    c.tmax_max,
    c.tmin_min,
    c.tavg_anomalie

FROM {{ ref('fct_agriculture') }} AS f

LEFT JOIN {{ ref('int_climat_campagne') }} AS c
    ON f.observation_id = c.agriculture_observation_id
