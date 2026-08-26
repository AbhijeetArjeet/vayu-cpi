"""
services/persistence/db.py
PostgreSQL/TimescaleDB persistence layer for raw fare observations.

Uses TimescaleDB's hypertable extension for the time-series fare table
if the extension is available; falls back to a plain Postgres table
otherwise (functionally identical, just without automatic time
partitioning -- fine for a hackathon-scale demo).

Env vars:
    DATABASE_URL  e.g. postgresql+psycopg2://user:pass@localhost:5432/vayu_cpi
"""

from __future__ import annotations

import os
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    create_engine,
    text,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from core.schemas import RawFareRecord

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/vayu_cpi"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class FareObservation(Base):
    __tablename__ = "fare_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portal = Column(String(64), nullable=False)
    flight_number = Column(String(32), nullable=False)
    carrier_code = Column(String(4), nullable=False)
    origin = Column(String(3), nullable=False, index=True)
    destination = Column(String(3), nullable=False, index=True)
    departure_time = Column(DateTime, nullable=False)
    scraped_at = Column(DateTime, nullable=False, index=True)
    horizon_days = Column(Integer, nullable=False, index=True)

    base_fare = Column(Float, nullable=False)
    fuel_surcharge_yq = Column(Float, default=0.0)
    airport_fee_udf = Column(Float, default=0.0)
    convenience_fee = Column(Float, default=0.0)
    total_fare = Column(Float, nullable=False)


def init_db() -> None:
    """Creates tables and attempts to convert fare_observations into a
    TimescaleDB hypertable. Safe to call repeatedly."""
    Base.metadata.create_all(engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
            conn.execute(
                text(
                    "SELECT create_hypertable('fare_observations', 'scraped_at', "
                    "if_not_exists => TRUE);"
                )
            )
            conn.commit()
        except Exception as e:
            # TimescaleDB extension not available (e.g. plain Postgres in
            # a hackathon sandbox) -- table still works as a normal table.
            print(f"[db] TimescaleDB hypertable setup skipped: {e}")
            conn.rollback()


def save_fare_records(records: list[RawFareRecord]) -> int:
    """Bulk-inserts a batch of fare records. Returns the count saved."""
    session = SessionLocal()
    try:
        rows = [
            FareObservation(
                portal=r.portal,
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
        return len(rows)
    finally:
        session.close()


def fetch_observations(
    origin: str,
    destination: str,
    horizon_days: int,
    since: datetime | None = None,
    until: datetime | None = None,
) -> list[FareObservation]:
    """Fetches raw observations for one route+horizon, optionally bounded
    to a time window. Used by the index engine to pull the sample set
    for both the "current" period and the "base" period."""
    session = SessionLocal()
    try:
        q = session.query(FareObservation).filter(
            FareObservation.origin == origin,
            FareObservation.destination == destination,
            FareObservation.horizon_days == horizon_days,
        )
        if since is not None:
            q = q.filter(FareObservation.scraped_at >= since)
        if until is not None:
            q = q.filter(FareObservation.scraped_at <= until)
        return q.order_by(FareObservation.scraped_at.asc()).all()
    finally:
        session.close()
