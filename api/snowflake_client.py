"""
Connexion Snowflake de DataFlow360.

Ce module centralise la création des connexions Snowflake
utilisées par l'API.
"""

import os
from pathlib import Path

import snowflake.connector
from dotenv import load_dotenv

# Charge le fichier .env en développement local.
load_dotenv()


def _read_secret(path_variable: str) -> str:
    """
    Lit un secret depuis un fichier.

    Docker Compose peut monter les secrets dans /run/secrets/.
    En développement local, les chemins peuvent pointer vers
    le dossier secrets/ du projet.
    """

    path = os.getenv(path_variable)

    if not path:
        raise RuntimeError(f"La variable {path_variable} n'est pas configurée.")

    secret_path = Path(path)

    if not secret_path.exists():
        raise RuntimeError(f"Le fichier secret {secret_path} est introuvable.")

    return secret_path.read_text().strip()


def get_snowflake_connection():
    """
    Crée une connexion Snowflake avec l'utilisateur de service de l'API.

    L'authentification utilise une paire de clés RSA/JWT.

    Le paramstyle 'qmark' permet d'utiliser des placeholders '?'
    dans les requêtes SQL.
    """

    private_key_path = os.getenv("SNOWFLAKE_PRIVATE_KEY_PATH")

    if not private_key_path:
        raise RuntimeError("SNOWFLAKE_PRIVATE_KEY_PATH n'est pas configurée.")

    passphrase = _read_secret("SNOWFLAKE_PRIVATE_KEY_PASSWORD_FILE")

    return snowflake.connector.connect(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        user=os.environ["SNOWFLAKE_USER"],
        authenticator="SNOWFLAKE_JWT",
        private_key_file=private_key_path,
        private_key_file_pwd=passphrase,
        role=os.environ["SNOWFLAKE_ROLE"],
        warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
        database=os.environ["SNOWFLAKE_DATABASE"],
        schema=os.environ["SNOWFLAKE_SCHEMA"],
        paramstyle="qmark",
    )
