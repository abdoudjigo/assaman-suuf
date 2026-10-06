-- Doit retourner 0 ligne : l'union des trois sources ne doit perdre
-- ni dupliquer aucune ligne du staging.
WITH attendu AS (
    SELECT 'POSTGRES' AS source_system, COUNT(*) AS nb FROM {{ ref('stg_postgres_agriculture') }}
    UNION ALL
    SELECT 'MONGO', COUNT(*) FROM {{ ref('stg_mongo_agriculture') }}
    UNION ALL
    SELECT 'KAFKA', COUNT(*) FROM {{ ref('stg_kafka_agriculture') }}
),

obtenu AS (
    SELECT source_system, COUNT(*) AS nb
    FROM {{ ref('int_agriculture') }}
    GROUP BY source_system
)

SELECT
    a.source_system,
    a.nb AS nb_staging,
    COALESCE(o.nb, 0) AS nb_intermediate
FROM attendu AS a
LEFT JOIN obtenu AS o
    ON a.source_system = o.source_system
WHERE a.nb <> COALESCE(o.nb, 0)
