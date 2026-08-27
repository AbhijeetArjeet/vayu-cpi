import json
import logging
import os
import traceback
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from services.ingestion.live_fetcher import fetch_all_corridors, TRACKED_CORRIDORS, TRACKED_HORIZONS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.scheduler")

SWEEP_INTERVAL_MINUTES = 6 * 60  # Every 6 hours

def run_ingestion_sweep() -> None:
    now_str = datetime.now().isoformat()
    logger.info(
        f"\n[SCHEDULER_SWEEP_START]\n"
        f"  Timestamp : {now_str}\n"
        f"  Corridors : {len(TRACKED_CORRIDORS)} corridors {TRACKED_CORRIDORS}\n"
        f"  Horizons  : {TRACKED_HORIZONS} days\n"
        f"  Total Jobs: {len(TRACKED_CORRIDORS) * len(TRACKED_HORIZONS)} route-horizon sweeps"
    )
    
    try:
        records = fetch_all_corridors()
    except Exception as exc:
        logger.error(
            f"[SCHEDULER_SWEEP_FAILED] Ingestion sweep failed during fetch: {exc}\n"
            f"{traceback.format_exc()}"
        )
        return

    if not records:
        logger.warning("[SCHEDULER_SWEEP_EMPTY] Sweep completed but produced 0 records -- check upstream Google Flights response.")
        return

    # Database persistence with detailed telemetry
    try:
        from services.persistence.db import save_fare_records_with_diagnostics
        db_diag = save_fare_records_with_diagnostics(records)
        if db_diag["status"] == "success":
            logger.info(f"[SCHEDULER_DB_SUCCESS] Successfully persisted {db_diag['inserted']} fare records to DB.")
        else:
            err = db_diag.get("error") or {}
            logger.error(f"[SCHEDULER_DB_FAILED] DB persistence failed ({err.get('type')}): {err.get('message')}. Falling back to JSON snapshot.")
            save_to_json(records)
    except Exception as db_exc:
        logger.error(f"[SCHEDULER_DB_EXC] Unexpected error saving to DB: {db_exc}. Saving to JSON fallback.")
        save_to_json(records)


def save_to_json(records):
    os.makedirs("data/fare_snapshots", exist_ok=True)
    file_path = "data/fare_snapshots/live_airfare_feed.json"
    data = [r.model_dump(mode="json") for r in records]
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    logger.info(f"[JSON_FALLBACK_SUCCESS] Saved {len(records)} records to {file_path}")


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
