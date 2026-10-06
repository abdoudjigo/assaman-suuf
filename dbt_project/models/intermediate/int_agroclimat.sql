-- Analyse agroclimatique :
-- une ligne représente une campagne agricole,
-- une station de la région et un mois climatique
-- compris entre le semis et la récolte.

SELECT
    f.observation_id AS agriculture_observation_id,

    f.zone_key,
    z.region,

    f.produit_key,
    f.fnid,
    f.saison,

    f.annee_semis,
    f.mois_semis,
    f.annee_recolte,
    f.mois_recolte,

    f.systeme_production,
    f.indicateur_qualite,
    f.superficie_ha,
    f.production_t,
    f.rendement_t_ha,

    s.station_key,
    s.station,
    s.station_nom,

    c.observation_id AS climat_observation_id,

    t.date_key,
    t.annee AS annee_climatique,
    t.mois AS mois_climatique,

    c.tavg,
    c.tmin,
    c.tmax,
    c.prcp_mm,
    c.nb_jours

FROM {{ ref('fct_agriculture') }} AS f

INNER JOIN {{ ref('dim_zone') }} AS z
    ON f.zone_key = z.zone_key

INNER JOIN {{ ref('dim_station') }} AS s
    ON z.zone_key = s.zone_key

INNER JOIN {{ ref('fct_climat') }} AS c
    ON s.station_key = c.station_key

INNER JOIN {{ ref('dim_temps') }} AS t
    ON c.date_key = t.date_key

WHERE t.annee = f.annee_recolte
  AND t.mois BETWEEN f.mois_semis AND f.mois_recolte
