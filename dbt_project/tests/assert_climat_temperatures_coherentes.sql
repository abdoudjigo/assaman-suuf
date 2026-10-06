{{ config(severity='warn') }}

-- Doit retourner 0 ligne : la température moyenne doit être
-- comprise entre la minimale et la maximale.
SELECT *
FROM {{ ref('fct_climat') }}
WHERE tmin > tmax
   OR tavg < tmin
   OR tavg > tmax
