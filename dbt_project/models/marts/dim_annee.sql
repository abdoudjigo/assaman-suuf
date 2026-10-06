-- Dimension année :
-- une ligne représente une année, partagée par les campagnes
-- (année de récolte) et le climat (via dim_temps).

SELECT DISTINCT
    annee,
    FLOOR(annee / 10) * 10 AS decennie

FROM {{ ref('dim_temps') }}
