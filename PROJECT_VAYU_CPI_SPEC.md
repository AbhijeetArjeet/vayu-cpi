# VAYU-CPI: Master Specification & AI Assembly Contract
**Project:** Real-Time Airfare Price Index for India (Augmenting Consumer Price Index)  
**Hackathon PS No:** SIH26056  
**Architecture Style:** Decoupled 3-Track Micro-Architecture  

---

## 1. System Assembly Blueprint

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE SCHEMA CONTRACT                            │
│                       `core/schemas.py`                                │
└──────────────┬─────────────────────────┬───────────────────────────────┘
               │                         │
               ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────────────────────┐
│ TRACK 1: INGESTION PIPELINE │ │ TRACK 2: STORAGE & ECONOMETRIC BACKEND │
│ • `fast-flights` live feed  │ │ • TimescaleDB / SQLAlchemy             │
│ • Fee unbundling (YQ/UDF)   │ │ • Jevons micro-index calculator        │
│ • 6-corridor horizon matrix │ │ • DGCA volume-weighted Laspeyres CPI   │
│ • Async scheduler           │ │ • 3-Sigma surge anomaly detector       │
└──────────────┬──────────────┘ │ • FastAPI REST routes (MoSPI/DGCA)     │
               │                └───────────────────┬────────────────────┘
               │ Write to DB / JSON                 │ REST Endpoints
               └────────────────► [FastAPI API] ◄───┘
                                       │
                                       ▼
                        ┌─────────────────────────────────┐
                        │ TRACK 3: DUAL-PERSONA DASHBOARD │
                        │ • Next.js 14 App Router         │
                        │ • MoSPI Macro View (2024=100)   │
                        │ • DGCA Surge & Gouging Matrix   │
                        │ • Recharts + Tailwind CSS       │
                        └─────────────────────────────────┘
```

---

## 2. Shared Single Source of Truth (`core/schemas.py`)
> **RULE:** No AI agent may alter field names or types in this file.

```python
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RawFareRecord(BaseModel):
  """Shared schema: Emitted by Track 1, ingested and stored by Track 2."""

  portal: str = Field(default="Google Flights Live Feed")
  carrier_name: str = Field(..., example="IndiGo")
  carrier_code: str = Field(..., example="6E")
  flight_number: str = Field(..., example="6E-205")
  origin: str = Field(..., min_length=3, max_length=3, example="DEL")
  destination: str = Field(..., min_length=3, max_length=3, example="BOM")
  departure_time: str = Field(..., example="2026-09-02 08:30")
  scraped_at: str = Field(..., example="2026-08-26T22:30:00")
  horizon_days: int = Field(..., example=7)  # 30 (Advance), 7 (Mid), 1 (Tatkal)
  base_fare: float
  fuel_surcharge_yq: float = 0.0
  airport_fee_udf: float = 0.0
  convenience_fee: float = 0.0
  total_fare: float


class RouteJevonsIndex(BaseModel):
  """Route-level geometric mean micro-index computed by Track 2."""

  origin: str
  destination: str
  horizon_days: int
  current_geom_mean: float
  base_geom_mean: float
  jevons_index: float  # (current / base) * 100
  sample_size: int


class NationalCompositeCPI(BaseModel):
  """Payload served to Track 3 (MoSPI Macro View)."""

  calculation_date: str
  composite_index: float  # Base 2024 = 100
  advance_sub_index: float  # T-30
  spot_sub_index: float  # T-1
  tracked_corridors: int
  dgca_traffic_coverage_pct: float


class SurgeAlert(BaseModel):
  """Payload served to Track 3 (DGCA Governance Portal)."""

  corridor: str
  origin: str
  destination: str
  current_fare: float
  baseline_30d_fare: float
  sigma_deviation: float
  severity: str  # CRITICAL, HIGH, MODERATE
  carrier_dominance: str
  flagged_at: str
```

---

## 3. Project File Tree Structure

```text
vayu-cpi/
├── core/
│   ├── __init__.py
│   ├── schemas.py                 # Pydantic models (contract above)
│   └── dgca_weights.py            # Official DGCA city-pair traffic weights
├── services/
│   ├── ingestion/                 # [TRACK 1]
│   │   ├── live_fetcher.py        # fast-flights real-time collector
│   │   ├── unbundler.py           # Fee decomposition parser
│   │   └── scheduler.py           # Periodic cron collector
│   ├── engine/                    # [TRACK 2]
│   │   ├── index_calculator.py    # Jevons micro & Laspeyres composite
│   │   ├── anomaly_detector.py    # 3-sigma surge detection engine
│   │   └── seed_base_2024.py      # Base period seed script
│   ├── persistence/               # [TRACK 2]
│   │   └── db.py                  # SQLAlchemy & TimescaleDB setup
│   └── api/                       # [TRACK 2]
│       ├── main.py                # FastAPI app setup
│       ├── routes_cpi.py          # /api/v1/cpi/* endpoints
│       └── routes_dgca.py         # /api/v1/dgca/* endpoints
└── web/                           # [TRACK 3]
    ├── app/
    │   ├── layout.tsx             # Shell + Navbar
    │   ├── page.tsx               # Entry & Overview
    │   ├── mospi/page.tsx         # MoSPI Macro Inflation Portal
    │   └── dgca/page.tsx          # DGCA Regulatory Surge Matrix
    ├── lib/api.ts                 # Axios / Fetch client to Backend
    └── package.json
```

---

## 4. Work Division & Direct Prompts for AI

### 🔴 PROMPT FOR AI 1: Track 1 (Live Ingestion Pipeline)

Copy and paste this directly to Claude / ChatGPT:

```text
You are building Track 1 (services/ingestion/) for project VAYU-CPI (SIH26056).
Goal: Fetch 100% REAL LIVE flight data using the fast-flights library (no fake data, no Amadeus test sandbox).

Tasks:
1. Create `services/ingestion/live_fetcher.py`:
   - Query routes: DEL-BOM, BOM-DEL, BLR-DEL, DEL-CCU, DEL-PAT, BOM-GOI.
   - Horizons: T-30, T-7, T-1.
   - Use `fast_flights.create_query` and `fast_flights.get_flights` with currency="INR", trip="one-way", seat="economy".
2. Create `services/ingestion/unbundler.py`:
   - Decompose total ticket price into:
     - airport_fee_udf: DEL/BOM (650), BLR (580), CCU (480), PAT (350), GOI (390).
     - convenience_fee: 300.0.
     - fuel_surcharge_yq: 600.0.
     - base_fare: total_fare - (udf + convenience + yq).
3. Validate and output instances of `core.schemas.RawFareRecord`.
4. Create `services/ingestion/scheduler.py` using APScheduler to run every 6 hours and dump to JSON or call DB insertion.
```

---

### 🔵 PROMPT FOR AI 2: Track 2 (Econometric Engine & FastAPI Backend)

Copy and paste this directly to Claude / ChatGPT:

```text
You are building Track 2 (services/engine/, services/persistence/, services/api/) for VAYU-CPI (SIH26056).
Goal: Store fare records in PostgreSQL/TimescaleDB, calculate official price indices, run 3-sigma anomaly detection, and serve REST endpoints.

Tasks:
1. Create `core/dgca_weights.py` with passenger weights:
   DEL-BOM: 0.26, BOM-DEL: 0.24, BLR-DEL: 0.20, DEL-CCU: 0.14, DEL-PAT: 0.09, BOM-GOI: 0.07.
   Horizon alphas: T-30 = 0.35, T-7 = 0.45, T-1 = 0.20.
2. Create `services/engine/seed_base_2024.py` to populate baseline geometric mean prices (DEL-BOM: ₹4,200, etc.) representing Base 2024 = 100.
3. Create `services/engine/index_calculator.py`:
   - Calculate elementary Jevons Micro-Index: Geometric mean of current fares / Base fares * 100.
   - Aggregate to National Composite CPI using DGCA passenger volume weights and horizon alphas.
4. Create `services/engine/anomaly_detector.py`:
   - Flag routes where current fare >= rolling_mean_30d + (3.0 * std_dev).
5. Create FastAPI routes in `services/api/`:
   - GET `/api/v1/cpi/airfare-index` (Returns time-series NationalCompositeCPI).
   - GET `/api/v1/cpi/export/csv` (Download official MoSPI format CSV).
   - GET `/api/v1/dgca/surge-alerts` (Returns list of SurgeAlert).
   - GET `/api/v1/dgca/decomposition` (Returns unbundled fee data by route).
All endpoints must strictly validate against `core.schemas`.
```

---

### 🟢 PROMPT FOR AI 3: Track 3 (Dual-Persona Next.js Dashboards)

Copy and paste this directly to Claude / ChatGPT:

```text
You are building Track 3 (web/) for VAYU-CPI (SIH26056) using Next.js 14 App Router, Tailwind CSS, Lucide-React, and Recharts.
Goal: Build dual-persona government dashboards connecting to FastAPI on http://localhost:8000.

Tasks:
1. Create `web/lib/api.ts` to call backend endpoints with mock fallbacks if the server is starting.
2. Create `web/app/mospi/page.tsx` (MoSPI Inflation View):
   - Metric cards: Composite Airfare CPI (Base 2024=100), Spot (T-1), Advance (T-30), DGCA Traffic Coverage (%).
   - AreaChart showing time-series CPI trend with horizon toggles.
   - Working "Export Official MoSPI CSV" button hitting `/api/v1/cpi/export/csv`.
3. Create `web/app/dgca/page.tsx` (DGCA Regulatory Matrix):
   - Active surge anomaly alert table with severity badges (CRITICAL, HIGH, MODERATE).
   - Stacked BarChart showing unbundled fee decomposition (Base, Fuel YQ, Airport UDF, Convenience Fee).
   - Route monopoly (HHI) concentration cards.
4. Create modern dark-theme shell in `web/app/layout.tsx` with top navigation between MoSPI and DGCA views.
```

---

## 5. End-of-Day Integration Checklist

When each track completes its prompt:

1. **Track 1 Check:** Run `python services/ingestion/live_fetcher.py` and verify `RawFareRecord` JSON prints with real prices.
2. **Track 2 Check:** Run `uvicorn services.api.main:app --reload` and check `http://localhost:8000/docs`.
3. **Track 3 Check:** Run `cd web && npm run dev` and open `http://localhost:3000/mospi` and `http://localhost:3000/dgca`.
