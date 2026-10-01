-- =====================================================================
-- DataFlow360 - Étape 1 : staging (TEXT) -> table finale (types)
-- Usage : psql -U postgres -d dataflow360_source_2 -f sql/02_transform_staging.sql
-- Pré-requis : stg_agriculture_raw a été remplie avec \copy
-- =====================================================================

-- On repart de zéro pour pouvoir relancer le script sans doublons
TRUNCATE TABLE agriculture_production RESTART IDENTITY;

INSERT INTO agriculture_production (
    fnid, region, departement, produit, saison,
    annee_semis, mois_semis, annee_recolte, mois_recolte,
    systeme_production, indicateur_qualite,
    superficie_ha, production_t, rendement_t_ha
)
SELECT
    NULLIF(TRIM(fnid), ''),
    NULLIF(TRIM(region), ''),
    NULLIF(TRIM(departement), ''),
    NULLIF(TRIM(produit), ''),
    NULLIF(TRIM(saison), ''),
    -- ::NUMERIC::SMALLINT accepte aussi bien '1962' que '1962.0'
    NULLIF(TRIM(annee_semis), '')::NUMERIC::SMALLINT,
    NULLIF(TRIM(mois_semis), '')::NUMERIC::SMALLINT,
    NULLIF(TRIM(annee_recolte), '')::NUMERIC::SMALLINT,
    NULLIF(TRIM(mois_recolte), '')::NUMERIC::SMALLINT,
    NULLIF(TRIM(systeme_production), ''),
    NULLIF(TRIM(indicateur_qualite), '')::NUMERIC::SMALLINT,
    NULLIF(TRIM(superficie_ha), '')::DOUBLE PRECISION,
    NULLIF(TRIM(production_t), '')::DOUBLE PRECISION,
    NULLIF(TRIM(rendement_t_ha), '')::DOUBLE PRECISION
FROM stg_agriculture_raw;
