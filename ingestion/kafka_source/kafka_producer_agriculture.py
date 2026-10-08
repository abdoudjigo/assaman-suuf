"""
Producteur Kafka - rejeu du fichier kafka_agriculture_2006_2015.jsonl

Lit le fichier JSONL (un event par ligne : {"key": ..., "data": {...}})
et publie chaque event sur le topic topic_kafka_agriculture, avec la clé
d'origine comme clé Kafka (garantit l'ordre par fnid/produit/saison/annee
sur une même partition).

Usage:
    python kafka_producer_agriculture.py --file kafka_agriculture_2006_2015.jsonl
    python kafka_producer_agriculture.py --file kafka_agriculture_2006_2015.jsonl --delay 0.05
"""

import argparse
import json
import logging
import sys
import time

from kafka import KafkaProducer
from kafka.errors import KafkaError

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("kafka_producer_agriculture")

DEFAULT_TOPIC = "topic_kafka_agriculture"


def build_producer(bootstrap_servers: str) -> KafkaProducer:
    # La clé conserve le partitionnement métier; les valeurs restent en UTF-8, y compris les caractères accentués.
    return KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        key_serializer=lambda k: k.encode("utf-8"),
        value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode("utf-8"),
        # Attendre l'accusé de réception de toutes les répliques et réessayer en cas d'échec transitoire.
        acks="all",
        retries=5,
        linger_ms=50,
    )


def on_send_success(record_metadata):
    logger.debug(
        "OK topic=%s partition=%s offset=%s",
        record_metadata.topic,
        record_metadata.partition,
        record_metadata.offset,
    )


def on_send_error(excp):
    logger.error("Echec d'envoi du message", exc_info=excp)


def replay_jsonl(
    file_path: str, topic: str, bootstrap_servers: str, delay: float, dry_run: bool
) -> None:
    # En mode simulation, ne pas ouvrir de connexion au broker.
    producer = None if dry_run else build_producer(bootstrap_servers)

    sent, errors = 0, 0
    with open(file_path, "r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue

            # Une ligne invalide ne bloque pas le rejeu des événements suivants.
            try:
                event = json.loads(line)
            except json.JSONDecodeError as exc:
                logger.warning(
                    "Ligne %d ignorée (JSON invalide) : %s", line_number, exc
                )
                errors += 1
                continue

            key = event.get("key")
            value = event.get("data")

            if key is None or value is None:
                logger.warning(
                    "Ligne %d ignorée (champ 'key' ou 'data' manquant)", line_number
                )
                errors += 1
                continue

            # L'envoi est asynchrone; les callbacks journalisent son résultat sans interrompre la lecture.
            if dry_run:
                logger.info("[DRY-RUN] topic=%s key=%s", topic, key)
            else:
                future = producer.send(topic, key=key, value=value)
                future.add_callback(on_send_success)
                future.add_errback(on_send_error)

            sent += 1
            if delay > 0:
                time.sleep(delay)

    if producer is not None:
        # Attendre les envois encore en attente avant de fermer proprement le producteur.
        producer.flush(timeout=30)
        producer.close()

    logger.info("Terminé : %d events publiés, %d lignes en erreur", sent, errors)


def parse_args() -> argparse.Namespace:
    # Centralise les options de rejeu et leurs valeurs par défaut dans l'interface CLI.
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--file", required=True, help="Chemin du fichier JSONL à rejouer"
    )
    parser.add_argument(
        "--topic",
        default=DEFAULT_TOPIC,
        help=f"Topic Kafka cible (défaut: {DEFAULT_TOPIC})",
    )
    parser.add_argument(
        "--bootstrap-servers",
        default="localhost:9092",
        help="Adresse(s) du cluster Kafka (défaut: localhost:9092)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.0,
        help="Pause en secondes entre deux publications, pour simuler un flux (défaut: 0 = aussi vite que possible)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="N'envoie rien à Kafka, se contente de lire et lister les events (test sans broker)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        replay_jsonl(
            file_path=args.file,
            topic=args.topic,
            bootstrap_servers=args.bootstrap_servers,
            delay=args.delay,
            dry_run=args.dry_run,
        )
    except FileNotFoundError:
        logger.error("Fichier introuvable : %s", args.file)
        return 1
    except KafkaError as exc:
        logger.error("Erreur Kafka : %s", exc)
        return 1
    # Un code nul indique que le rejeu s'est terminé sans erreur fatale.
    return 0


if __name__ == "__main__":
    sys.exit(main())
