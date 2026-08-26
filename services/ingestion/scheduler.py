import json
import logging
import os
from apscheduler.schedulers.blocking import BlockingScheduler
from services.ingestion.live_fetcher import fetch_all_corridors
from services.ingestion.amadeus_fetcher import fetch_live_gds_flights

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.scheduler")

SWEEP_INTERVAL_MINUTES = 6 * 60  # Every 6 hours

def run_ingestion_sweep() -> None:
    logger.info("Starting scheduled ingestion sweep")
    records = fetch_all_corridors()
    
    if not records:
        logger.warning("Sweep produced 0 records -- check upstream connectivity")
        return

    # Try saving to DB if available, else JSON
    try:
        from services.persistence.db import save_fare_records
        save_fare_records(records)
        logger.info(f"Persisted {len(records)} fare records to DB")
    except ImportError:
        logger.info("DB module not found, saving to JSON fallback.")
        save_to_json(records)

def save_to_json(records):
    os.makedirs("data/fare_snapshots", exist_ok=True)
    file_path = "data/fare_snapshots/live_airfare_feed.json"
    data = [r.model_dump(mode="json") for r in records]
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    logger.info(f"Saved {len(records)} records to {file_path}")

def start_scheduler() -> None:
    scheduler = BlockingScheduler()
    scheduler.add_job(
        run_ingestion_sweep,
        "interval",
        minutes=SWEEP_INTERVAL_MINUTES,
        next_run_time=None,
        id="vayu_cpi_ingestion_sweep",
    )
    logger.info(f"Scheduler started -- sweeping every {SWEEP_INTERVAL_MINUTES} minutes")
    run_ingestion_sweep()
    scheduler.start()

if __name__ == "__main__":
    start_scheduler()
