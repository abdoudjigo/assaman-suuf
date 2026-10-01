-- =====================================================================
-- DataFlow360 - PostgreSQL SOURCE - Agriculture 1960-1989
-- Étape 1 : création des tables
-- Usage : psql -U postgres -d dataflow360_source -f sql/01_create_tables.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table 1 : stg_agriculture_raw  (zone d'atterrissage / "staging")
-- Tout est en TEXT : on y copie le CSV tel quel, sans risque d'erreur
-- de type. Cette table est temporaire : on peut la vider ou la supprimer
-- après chaque chargement.
-- ATTENTION : l'ordre des colonnes doit être EXACTEMENT celui du CSV.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS stg_agriculture_raw;

CREATE TABLE stg_agriculture_raw (
    fnid                TEXT,
    region              TEXT,
    departement         TEXT,
    produit             TEXT,
    saison              TEXT,
    annee_semis         TEXT,
    mois_semis          TEXT,
    annee_recolte       TEXT,
    mois_recolte        TEXT,
    systeme_production  TEXT,
    indicateur_qualite  TEXT,
    superficie_ha       TEXT,
    production_t        TEXT,
    rendement_t_ha      TEXT
);

-- ---------------------------------------------------------------------
-- Table 2 : agriculture_production  (table finale, bien typée)
-- C'est CETTE table que Python / DLT liront pour aller vers Snowflake.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agriculture_production (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fnid                VARCHAR(30)  NOT NULL,
    region              VARCHAR(100),
    departement         VARCHAR(100),
    produit             VARCHAR(100) NOT NULL,
    saison              VARCHAR(50),
    annee_semis         SMALLINT,
    mois_semis          SMALLINT CHECK (mois_semis   BETWEEN 1 AND 12),
    annee_recolte       SMALLINT,
    mois_recolte        SMALLINT CHECK (mois_recolte BETWEEN 1 AND 12),
    systeme_production  VARCHAR(100),
    indicateur_qualite  SMALLINT,
    superficie_ha       DOUBLE PRECISION CHECK (superficie_ha  >= 0),
    production_t        DOUBLE PRECISION CHECK (production_t   >= 0),
    rendement_t_ha      DOUBLE PRECISION CHECK (rendement_t_ha >= 0)
);
