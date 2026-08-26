"""
services/persistence/db.py
PostgreSQL/TimescaleDB persistence layer for raw fare observations.
"""

from __future__ import annotations

import os
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
    """Creates tables and attempts to convert fare_observations into a TimescaleDB hypertable."""
    Base.metadata.create_all(engine)
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))
            # Note: hypertable on string time column may fail, but we'll try
            conn.execute(
                text(
                    "SELECT create_hypertable('fare_observations', 'scraped_at', "
                    "if_not_exists => TRUE);"
                )
            )
            conn.commit()
        except Exception as e:
            print(f"[db] TimescaleDB hypertable setup skipped: {e}")
            conn.rollback()


def save_fare_records(records: list[RawFareRecord]) -> int:
    """Bulk-inserts a batch of fare records. Returns the count saved."""
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
        return len(rows)
    finally:
        session.close()


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
