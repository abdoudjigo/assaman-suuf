"""Connexion Snowflake utilisée par les scripts ML."""

import os
from pathlib import Path

import snowflake.connector
from dotenv import load_dotenv

from ml.scripts.config import RACINE_PROJET


def _lire_secret(path: Path) -> str:
    """Lit un secret dans un fichier."""
    if not path.exists():
        raise RuntimeError(f"Fichier secret introuvable : {path}")
    return path.read_text().strip()


#def _chemin_secret(variable: str, defaut: Path) -> Path:
#    """Retourne le chemin configuré ou le chemin local par défaut."""
#    valeur = os.getenv(variable)
#    return Path(valeur) if valeur else defaut

def _chemin_secret(variable: str, defaut: Path) -> Path:
    """Retourne un chemin absolu pour un secret."""
    valeur = os.getenv(variable)

    if not valeur:
        return defaut

    path = Path(valeur)

    if path.is_absolute():
        return path

    return RACINE_PROJET / "api" / path

def connexion(schema: str = "ML"):
    """
    Ouvre une connexion Snowflake avec l'authentification RSA/JWT.

    Les paramètres non sensibles viennent de api/.env.
    Les deux fichiers de clé restent dans api/secrets/.
    """

    load_dotenv(RACINE_PROJET / "api" / ".env")

    obligatoires = [
        "SNOWFLAKE_USER",
        "SNOWFLAKE_ACCOUNT",
        "SNOWFLAKE_ROLE",
        "SNOWFLAKE_WAREHOUSE",
        "SNOWFLAKE_DATABASE",
    ]

    manquantes = [v for v in obligatoires if not os.getenv(v)]
    if manquantes:
        raise RuntimeError(
            "Variables manquantes dans api/.env : "
            + ", ".join(manquantes)
        )

    cle_privee = _chemin_secret(
        "SNOWFLAKE_PRIVATE_KEY_PATH",
        RACINE_PROJET / "api" / "secrets" / "snowflake_api_key.pem",
    )

    mot_de_passe_cle = _chemin_secret(
        "SNOWFLAKE_PRIVATE_KEY_PASSWORD_FILE",
        RACINE_PROJET
        / "api"
        / "secrets"
        / "snowflake_api_key_password.txt",
    )

    return snowflake.connector.connect(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        user=os.environ["SNOWFLAKE_USER"],
        authenticator="SNOWFLAKE_JWT",
        private_key_file=str(cle_privee),
        private_key_file_pwd=_lire_secret(mot_de_passe_cle),
        role=os.environ["SNOWFLAKE_ROLE"],
        warehouse=os.environ["SNOWFLAKE_WAREHOUSE"],
        database=os.environ["SNOWFLAKE_DATABASE"],
        schema=schema,
        paramstyle="qmark",
    )
