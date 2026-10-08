"""Connexion à Snowflake à partir du fichier .env du projet.

Reprend les variables déjà utilisées par l'ingestion et la CI :
SNOWFLAKE_USER, SNOWFLAKE_PASSWORD, SNOWFLAKE_ACCOUNT, et en option
SNOWFLAKE_ROLE, SNOWFLAKE_WAREHOUSE, SNOWFLAKE_DATABASE.

SNOWFLAKE_AUTHENTICATOR permet d'utiliser l'authentification du compte
(ex. "username_password_mfa" pour une validation MFA par notification).
"""

import os

import snowflake.connector
from dotenv import load_dotenv

from ml.scripts.config import RACINE_PROJET

VARIABLES_OBLIGATOIRES = ["SNOWFLAKE_USER", "SNOWFLAKE_PASSWORD", "SNOWFLAKE_ACCOUNT"]


def connexion(schema: str = "ML"):
    """Ouvre une connexion Snowflake. Les identifiants viennent de .env."""
    load_dotenv(RACINE_PROJET / ".env")

    manquantes = [v for v in VARIABLES_OBLIGATOIRES if not os.getenv(v)]
    if manquantes:
        raise RuntimeError(f"Variables manquantes dans .env : {', '.join(manquantes)}")

    parametres = {
        "user": os.environ["SNOWFLAKE_USER"],
        "password": os.environ["SNOWFLAKE_PASSWORD"],
        "account": os.environ["SNOWFLAKE_ACCOUNT"],
        "role": os.getenv("SNOWFLAKE_ROLE", "SYSADMIN"),
        "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE", "DATAFLOW360_WH"),
        "database": os.getenv("SNOWFLAKE_DATABASE", "DATAFLOW360"),
        "schema": schema,
        "paramstyle": "qmark",  # même style (?) que la connexion de l'API
    }

    return snowflake.connector.connect(**parametres)