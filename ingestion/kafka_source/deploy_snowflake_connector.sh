#!/bin/bash
# Déploie le Snowflake Sink Connector sur Kafka Connect via l'API REST.
# Usage : ./deploy_snowflake_connector.sh /chemin/vers/snowflake_kafka.p8

set -e

PRIVATE_KEY_FILE="${1:?Usage: $0 /chemin/vers/snowflake_kafka.p8}"
PRIVATE_KEY=$(grep -v "PRIVATE KEY" "$PRIVATE_KEY_FILE" | tr -d '\n')

curl -s -X POST http://localhost:8083/connectors \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "name": "snowflake-agriculture-sink",
  "config": {
    "connector.class": "com.snowflake.kafka.connector.SnowflakeSinkConnector",
    "tasks.max": "1",
    "topics": "topic_kafka_agriculture",
    "snowflake.url.name": "whpmweu-sy84726.snowflakecomputing.com:443",
    "snowflake.user.name": "kafka_connector_user",
    "snowflake.private.key": "${PRIVATE_KEY}",
    "snowflake.role.name": "KAFKA_CONNECTOR_ROLE",
    "snowflake.database.name": "DATAFLOW360",
    "snowflake.schema.name": "RAW",
    "snowflake.topic2table.map": "topic_kafka_agriculture:raw_kafka_agriculture",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "value.converter": "com.snowflake.kafka.connector.records.SnowflakeJsonConverter",
    "buffer.count.records": "1000",
    "buffer.flush.time": "60",
    "buffer.size.bytes": "5000000"
  }
}
EOF

echo ""
echo "--- Statut du connecteur ---"
curl -s http://localhost:8083/connectors/snowflake-agriculture-sink/status