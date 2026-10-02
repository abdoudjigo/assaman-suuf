#!/bin/bash
# Télécharge le plugin Snowflake Kafka Connector dans son propre sous-dossier.
# IMPORTANT : le plugin doit être isolé dans un sous-dossier dédié (pas directement
# dans plugins/), sinon Kafka Connect ne l'isole pas correctement et on obtient
# un conflit de classpath avec kafka-clients (NoSuchMethodError au démarrage).
#
# Usage : ./download_snowflake_connector.sh

set -e

CONNECTOR_VERSION="2.4.1"
PLUGIN_DIR="$(dirname "$0")/plugins/snowflake-kafka-connector"
JAR_NAME="snowflake-kafka-connector-${CONNECTOR_VERSION}.jar"
URL="https://repo1.maven.org/maven2/com/snowflake/snowflake-kafka-connector/${CONNECTOR_VERSION}/${JAR_NAME}"

mkdir -p "$PLUGIN_DIR"

if [ -f "$PLUGIN_DIR/$JAR_NAME" ]; then
    echo "Déjà présent : $PLUGIN_DIR/$JAR_NAME"
    exit 0
fi

echo "Téléchargement de $JAR_NAME..."
curl -L -o "$PLUGIN_DIR/$JAR_NAME" "$URL"
echo "OK : $PLUGIN_DIR/$JAR_NAME"