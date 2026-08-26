"""
services/ingestion/scheduler.py
Automated pipeline that periodically runs the ingestion sweep and hands
collected records to persistence. Uses APScheduler so it can run as a
standalone worker process alongside the FastAPI app.

Install:
    pip install apscheduler
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.blocking import BlockingScheduler

from services.ingestion.amadeus_fetcher import fetch_live_gds_flights
from services.ingestion.live_fetcher import fetch_all_tracked_routes
from services.persistence.db import save_fare_records  # see note below

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.scheduler")

# How often (minutes) to re-sweep every tracked route x horizon. Google
# Flights fares don't change minute-to-minute for most routes, so an
# aggressive interval mostly burns quota/risks rate-limiting without
# adding real signal -- every 60-120 min is a reasonable default for a
# hackathon demo; tighten only if you have quota to spare.
SWEEP_INTERVAL_MINUTES = 60


def run_ingestion_sweep() -> None:
    logger.info("Starting scheduled ingestion sweep")
    records = fetch_all_tracked_routes()

    # Amadeus is optional and fails soft (returns []) unless production
    # credentials are configured -- see amadeus_fetcher.py docstring.
    # Left out of the default sweep loop here since live_fetcher.py
    # already covers every tracked route/horizon; wire this in per-route
    # if you do get production Amadeus access and want to compare/merge
    # both sources for the same route+horizon.
    _ = fetch_live_gds_flights  # noqa: F841 -- kept as documented hook

    if not records:
        logger.warning("Sweep produced 0 records -- check upstream connectivity")
        return

    save_fare_records(records)
    logger.info(f"Persisted {len(records)} fare records")


def start_scheduler() -> None:
    scheduler = BlockingScheduler()
    scheduler.add_job(
        run_ingestion_sweep,
        "interval",
        minutes=SWEEP_INTERVAL_MINUTES,
        next_run_time=None,  # run immediately on start, see below
        id="vayu_cpi_ingestion_sweep",
    )
    logger.info(
        f"Scheduler started -- sweeping every {SWEEP_INTERVAL_MINUTES} minutes"
    )
    run_ingestion_sweep()  # prime the pipeline with an immediate run
    scheduler.start()


if __name__ == "__main__":
    start_scheduler()
