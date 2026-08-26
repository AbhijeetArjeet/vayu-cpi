# VAYU-CPI (SIH26056): Real-Time Airfare Price Index for India

> **Hackathon Problem Statement:** SIH26056  
> **Live Web Portal (Vercel):** [https://vayu-cpi.vercel.app](https://vayu-cpi.vercel.app)  
> **Live FastAPI Backend (Railway):** [https://web-production-e5a43.up.railway.app](https://web-production-e5a43.up.railway.app)  
> **GitHub Repository:** [https://github.com/AbhijeetArjeet/vayu-cpi](https://github.com/AbhijeetArjeet/vayu-cpi)  

---

## 📌 Executive Summary

**VAYU-CPI** is a decoupled 3-track micro-architecture designed to calculate a real-time domestic Airfare Price Index (Base 2024 = 100) for India to augment the Ministry of Statistics and Programme Implementation (**MoSPI**) Consumer Price Index basket and provide real-time regulatory oversight for the Directorate General of Civil Aviation (**DGCA**).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE SCHEMA CONTRACT                            │
│                       `core/schemas.py`                                │
└──────────────┬─────────────────────────┬───────────────────────────────┘
               │                         │
               ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────────────────────┐
│ TRACK 1: INGESTION PIPELINE │ │ TRACK 2: STORAGE & ECONOMETRIC BACKEND │
│ • `fast-flights` live feed  │ │ • PostgreSQL / TimescaleDB             │
│ • Fee unbundling (YQ/UDF)   │ │ • Jevons micro-index calculator        │
│ • 6-corridor horizon matrix │ │ • DGCA volume-weighted Laspeyres CPI   │
│ • Async scheduler           │ │ • 3-Sigma surge anomaly detector       │
└──────────────┬──────────────┘ │ • FastAPI REST routes (MoSPI/DGCA)     │
               │                └───────────────────┬────────────────────┘
               │ Write to DB                        │ REST Endpoints
               └────────────────► [FastAPI API] ◄───┘
                                       │
                                       ▼
                        ┌─────────────────────────────────┐
                        │ TRACK 3: DUAL-PERSONA DASHBOARD │
                        │ • Next.js 16 App Router         │
                        │ • MoSPI Macro View (2024=100)   │
                        │ • DGCA Surge & Gouging Matrix   │
                        │ • Recharts + Tailwind CSS       │
                        └─────────────────────────────────┘
```

---

## 🏛️ Key Features & Dual-Persona Portals

### 🔵 MoSPI Macroeconomic Inflation Portal (`/mospi`)
- **National Composite CPI Line Chart:** Volume-weighted Jevons-Laspeyres Index tracking monthly price shifts.
- **Horizon Sub-Indices:** T-30 (Advance Booking), T-7 (Mid Booking), T-1 (Tatkal / Spot Booking).
- **Official MoSPI Export:** One-click CSV export matching government reporting standards (`/api/v1/cpi/export/csv`).

### 🔴 DGCA Regulatory Surge Matrix (`/dgca`)
- **3-Sigma Anomaly Detection:** Real-time alert feed flagging routes where fares exceed $3.0\sigma$ above their 30-day rolling baseline.
- **Severity Badges:** Categorized by `CRITICAL` ($\ge 4.0\sigma$), `HIGH` ($\ge 3.5\sigma$), and `MODERATE` ($\ge 3.0\sigma$).
- **Fee Unbundling Stacked Chart:** Itemized breakdown of Base Fare, Fuel Surcharge ($YQ$), Airport User Development Fees ($UDF$), and Convenience Fees per corridor.
- **Monopoly Concentration Index (HHI):** Herfindahl-Hirschman Index derived from DGCA corridor traffic shares.

---

## 🛠️ Architecture & Work Division

### Track 1: Ingestion Pipeline (`services/ingestion/`)
- `live_fetcher.py`: Scrapes 100% real live flight quotes across 6 major Indian corridors (`DEL-BOM`, `BOM-DEL`, `BLR-DEL`, `DEL-CCU`, `DEL-PAT`, `BOM-GOI`) and 3 booking horizons ($T-30, T-7, T-1$) using `fast-flights`.
- `unbundler.py`: Decomposes total all-in ticket prices into Base Fare, Fuel Surcharge ($YQ=600$), Airport UDF ($DEL=650, BLR=580, CCU=480, PAT=350, GOI=390$), and Convenience Fee ($300$).
- `scheduler.py`: Background APScheduler executing periodic sweeps every 6 hours.

### Track 2: Econometric Engine & Backend (`services/engine/` & `services/api/`)
- `index_calculator.py`: Computes elementary geometric mean micro-indices ($Jevons$) per corridor, aggregated into a volume-weighted $Laspeyres$ national composite index.
- `dgca_weights.py`: Official DGCA city-pair passenger volume weights ($DEL-BOM: 0.26, BOM-DEL: 0.24, BLR-DEL: 0.20$, etc.) and horizon weights ($\alpha_{30}=0.35, \alpha_7=0.45, \alpha_1=0.20$).
- `anomaly_detector.py`: Evaluates rolling 30-day mean & standard deviation to generate `SurgeAlert` events.
- `routes_cpi.py` & `routes_dgca.py`: High-performance FastAPI endpoints strictly adhering to `core.schemas`.

### Track 3: Dual-Persona Web Dashboard (`web/`)
- Built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS**, **Recharts**, and **Lucide-React**.
- Fail-soft API client ([`web/lib/api.ts`](file:///c:/sih2026/NAFPI%20(National%20Airfare%20Price%20Index)/web/lib/api.ts)) with instant fallback demo mode if the backend is initializing.

---

## ⚡ Quick Start & Running Locally

### 1. Backend (FastAPI & Python)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server locally
python -m uvicorn services.api.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend (Next.js Dashboard)

```bash
cd web
npm install
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

The repository includes automated unit tests covering Pydantic schemas, DGCA weight resolutions, fee unbundling logic, base pricing, 3-sigma surge detection, and FastAPI endpoints.

```bash
python -m pytest tests/test_vayu.py
```

---

## 📖 Methodology & Data Disclosures

1. **Live Fares vs. Fee Unbundling:** `fast-flights` collects 100% live total ticket prices from Google Flights. The itemized fee split ($YQ, UDF$) is modeled using official statutory airport fee schedules published by DGCA/AERA.
2. **DGCA Corridor Weights:** Passenger volume weights in `core/dgca_weights.py` are derived from DGCA quarterly traffic statistics for top domestic trunk routes.
3. **Base 2024 Period:** Base period geometric mean pricing is seeded in `services/engine/seed_base_2024.py` representing $Base = 100$.
