#!/bin/bash
# Télécharge le plugin Snowflake Kafka Connector dans ingestion/kafka_source/plugins/.
# Ce .jar (~147 Mo) n'est volontairement pas versionné dans Git (voir .gitignore) :
# chaque personne le télécharge une fois via ce script.
#
# Usage : ./download_snowflake_connector.sh

set -e

CONNECTOR_VERSION="2.4.1"
PLUGIN_DIR="$(dirname "$0")/plugins"
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
