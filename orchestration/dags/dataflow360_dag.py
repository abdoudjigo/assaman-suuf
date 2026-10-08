from datetime import datetime, timezone

from airflow import DAG
from airflow.operators.empty import EmptyOperator

with DAG(
    dag_id="dataflow360_pipeline",
    start_date=datetime(2026, 1, 1, tzinfo=timezone.utc),
    schedule=None,
    catchup=False,
    tags=["DataFlow360"],
) as dag:

    start = EmptyOperator(task_id="start")

    check_raw = EmptyOperator(task_id="check_raw_tables")

    dbt_staging = EmptyOperator(task_id="dbt_staging")

    dbt_test = EmptyOperator(task_id="dbt_test")

    end = EmptyOperator(task_id="end")

    start >> check_raw >> dbt_staging >> dbt_test >> end
