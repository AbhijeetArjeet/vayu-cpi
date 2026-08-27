"""
services/persistence/db.py
PostgreSQL/TimescaleDB persistence layer for raw fare observations with rich stage logging.
"""

from __future__ import annotations

import os
import logging
import traceback
from typing import Dict, Any, List

from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    create_engine,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from core.schemas import RawFareRecord
from core.env_diag import sanitize_connection_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vayu-cpi.db")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vayu_test.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        pass
    logger.info(f"[DB_INIT] Successfully bound database engine: {sanitize_connection_url(DATABASE_URL)}")
except Exception as _conn_err:
    logger.warning(
        f"[DB_INIT_FALLBACK] Could not connect to primary DATABASE_URL ({sanitize_connection_url(DATABASE_URL)}): {_conn_err}. "
        "Falling back to local SQLite database (sqlite:///./vayu_test.db)"
    )
    engine = create_engine("sqlite:///./vayu_test.db")

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class FareObservation(Base):
    __tablename__ = "fare_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portal = Column(String(64), nullable=False)
    carrier_name = Column(String(64), nullable=False)
    flight_number = Column(String(32), nullable=False)
    carrier_code = Column(String(4), nullable=False)
    origin = Column(String(3), nullable=False, index=True)
    destination = Column(String(3), nullable=False, index=True)
    departure_time = Column(String, nullable=False)
    scraped_at = Column(String, nullable=False, index=True)
    horizon_days = Column(Integer, nullable=False, index=True)

    base_fare = Column(Float, nullable=False)
    fuel_surcharge_yq = Column(Float, default=0.0)
    airport_fee_udf = Column(Float, default=0.0)
    convenience_fee = Column(Float, default=0.0)
    total_fare = Column(Float, nullable=False)


def init_db() -> None:
    """Creates tables. Optionally sets up TimescaleDB hypertable (skipped on regular PostgreSQL/SQLite)."""
    try:
        Base.metadata.create_all(engine)
        logger.info("[DB_INIT] Database schema tables ensured.")
    except Exception as e:
        logger.error(f"[DB_INIT_ERROR] Table creation failed: {e}\n{traceback.format_exc()}")
        return

    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
            conn.execute(
                text(
                    "SELECT create_hypertable('fare_observations', 'scraped_at', "
                    "if_not_exists => TRUE);"
                )
            )
            conn.commit()
            logger.info("[DB_INIT] TimescaleDB hypertable enabled.")
    except Exception:
        # Expected on regular PostgreSQL or SQLite
        pass


def save_fare_records_with_diagnostics(records: list[RawFareRecord]) -> Dict[str, Any]:
    """Bulk-inserts records and returns detailed diagnostic metrics."""
    attempted_cnt = len(records)
    if not records:
        logger.info("[DB_INSERT] Zero records provided for persistence.")
        return {"status": "success", "attempted": 0, "inserted": 0, "error": None}

    logger.info(f"\n[DB_INSERT_START]\n  Attempted : {attempted_cnt} records")
    session = SessionLocal()
    try:
        rows = [
            FareObservation(
                portal=r.portal,
                carrier_name=r.carrier_name,
                flight_number=r.flight_number,
                carrier_code=r.carrier_code,
                origin=r.origin,
                destination=r.destination,
                departure_time=r.departure_time,
                scraped_at=r.scraped_at,
                horizon_days=r.horizon_days,
                base_fare=r.base_fare,
                fuel_surcharge_yq=r.fuel_surcharge_yq,
                airport_fee_udf=r.airport_fee_udf,
                convenience_fee=r.convenience_fee,
                total_fare=r.total_fare,
            )
            for r in records
        ]
        session.bulk_save_objects(rows)
        session.commit()
        inserted_cnt = len(rows)
        
        logger.info(
            f"\n[DB_INSERT_SUCCESS]\n"
            f"  Attempted : {attempted_cnt}\n"
            f"  Inserted  : {inserted_cnt}"
        )
        return {"status": "success", "attempted": attempted_cnt, "inserted": inserted_cnt, "error": None}
    except Exception as exc:
        session.rollback()
        exc_type = type(exc).__name__
        exc_msg = str(exc)
        tb_str = traceback.format_exc()
        
        logger.error(
            f"\n[DB_INSERT_FAILED]\n"
            f"  Attempted      : {attempted_cnt}\n"
            f"  Exception Type : {exc_type}\n"
            f"  Message        : {exc_msg}\n"
            f"  Traceback      :\n{tb_str}"
        )
        return {
            "status": "failed",
            "attempted": attempted_cnt,
            "inserted": 0,
            "error": {"type": exc_type, "message": exc_msg, "traceback": tb_str},
        }
    finally:
        session.close()


def save_fare_records(records: list[RawFareRecord]) -> int:
    """Bulk-inserts a batch of fare records. Returns the count saved."""
    diag = save_fare_records_with_diagnostics(records)
    if diag["status"] == "failed":
        # Do not swallow exception silently in production background worker
        err = diag.get("error") or {}
        raise RuntimeError(f"Database bulk insert failed ({err.get('type')}): {err.get('message')}")
    return diag.get("inserted", 0)


def fetch_observations(
    origin: str,
    destination: str,
    horizon_days: int,
    since=None,
    until=None,
) -> list[FareObservation]:
    """Fetches raw observations for one route+horizon."""
    session = SessionLocal()
    try:
        q = session.query(FareObservation).filter(
            FareObservation.origin == origin,
            FareObservation.destination == destination,
            FareObservation.horizon_days == horizon_days,
        )
        if since is not None:
            since_str = since.isoformat() if hasattr(since, 'isoformat') else str(since)
            q = q.filter(FareObservation.scraped_at >= since_str)
        if until is not None:
            until_str = until.isoformat() if hasattr(until, 'isoformat') else str(until)
            q = q.filter(FareObservation.scraped_at <= until_str)
        return q.order_by(FareObservation.scraped_at.asc()).all()
    finally:
        session.close()


def fetch_all_observations() -> list[FareObservation]:
    session = SessionLocal()
    try:
        return session.query(FareObservation).all()
    finally:
        session.close()
