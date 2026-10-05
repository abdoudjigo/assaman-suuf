SELECT *
FROM {{ ref('dim_temps') }}
WHERE mois IS NOT NULL
  AND (mois < 1 OR mois > 12)