# VAYU-CPI: The Complete Project Journey, History & Technical Architecture

> **Project Name**: VAYU-CPI (National Airfare Price Index for India)  
> **Problem Statement**: SIH26056 — Real-Time Aviation Inflation & Tariff Monitoring Engine  
> **Target Ministries**: Ministry of Statistics and Programme Implementation (MoSPI) & Directorate General of Civil Aviation (DGCA)  
> **SIH Presentation Date**: August 29, 2026  

---

## 🌟 Executive Summary: What is VAYU?

**VAYU-CPI** is India's first real-time, econometrically rigorous **National Airfare Price Index**. It solves a critical national challenge: **unmonitored airfare surges and opaque aviation inflation**.

Until VAYU, airfares were either tracked manually via periodic surveys or omitted from monthly inflation baskets due to high price volatility. VAYU continuously ingests real-time domestic flight prices, normalizes unbundled ancillary fees (seat selection, convenience fees, baggage), computes geometric mean micro-indices using the **Jevons Index methodology**, and aggregates them into a national composite CPI (Base 2024 = 100).

---

## 🚀 The Project Journey: Step-by-Step Evolution

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            THE VAYU EVOLUTION                           │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ PHASE 1: Production Ingestion Pipeline & Railway Deployment            │
 │   - Built live scrapers using fast-flights & PostgreSQL/TimescaleDB.    │
 │   - Handled anti-bot, captcha, and consent page detection cleanly.      │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ PHASE 2: Econometric Engine & Jevons Micro-Index Calculation            │
 │   - Implemented Jevons Geometric Mean Index (Base 2024 = 100).          │
 │   - Tracked 3 booking horizons: T-30 (Advance), T-7 (Mid), T-1 (Tatkal). │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ PHASE 3: Command Center Visual Overhaul & Next.js Frontend              │
 │   - Designed a Bloomberg/FinTech Aviation Control Center dashboard.      │
 │   - Added live stress gauges, top movers, and fee decomposition.        │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ PHASE 4: Full India Aviation Map & Three Explicit Data Modes           │
 │   - Expanded network to 30 Indian airports & 22 domestic corridors.     │
 │   - Created 3 explicit modes: LIVE ONLY, HISTORICAL ONLY, COMBINED.     │
 ├─────────────────────────────────────────────────────────────────────────┤
 │ PHASE 5: Dataset Registry, Admin Import Wizard & Sweep Control         │
 │   - Built admin import staging pipeline with quality validation.        │
 │   - Built bulk collection control panel with multi-horizon sweeps.      │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 The Three Core Data Modes (Scientific Honesty)

A key innovation of VAYU is **Scientific Honesty**. VAYU never fakes live observations and never labels historical datasets as live scraping. Users and judges can switch between three explicit data modes:

### 1. `LIVE ONLY` (Mode A)
- **Data Source**: Strictly live flight observations scraped from production Google Flights ingestion.
- **Use Case**: Real-time market monitoring and instant surge detection.
- **Calculation Label**: `LIVE OBSERVATIONS ONLY`.

### 2. `HISTORICAL ONLY` (Mode B)
- **Data Source**: Explicitly imported historical datasets and official DGCA tariff benchmarks (2024-2025).
- **Use Case**: Long-term inflation modeling, seasonal pattern analysis, and tariff policy evaluation.
- **Calculation Label**: `HISTORICAL DATASET ONLY`.

### 3. `LIVE + HISTORICAL` (Mode C - Combined)
- **Data Source**: Live observations supply the current spot period market state, while historical datasets supply the multi-year baseline context.
- **Methodology**: Documented normalization layer ensuring compatible aggregation without silent concatenation.
- **Calculation Label**: `LIVE + HISTORICAL COMBINED`.

---

## 🗺️ Full India Aviation Network Map

The interactive India map covers the **complete geographic outline of India** with **30 major domestic airport nodes**:

- **Node Visual States**:
  - 🟢 **LIVE DATA** (Green): Active VAYU live observations available.
  - 🔵 **HISTORICAL DATA ONLY** (Blue): Verified historical dataset observations available.
  - 🟣 **COMBINED** (Purple): Both live and historical observations available.
  - ⚪ **NO CURRENT DATA** (Gray outline): Reference airport node outline.
- **Toggleable Map Layers**: Airports, Live Routes, Historical Routes, Surge Alerts, Stress Scores.
- **Full India Search**: Search by airport code (`DEL`), city name (`Delhi`, `Mumbai`, `Patna`), or corridor (`DEL → BOM`).

---

## 🛠️ Technical Architecture

### Backend Stack (Python / FastAPI / SQLAlchemy)
- **API Framework**: FastAPI with CORS middleware.
- **Econometric Engine**: Jevons geometric mean micro-indices, route weighting derived from DGCA passenger volume, horizon weighting ($\alpha_{30}=0.35, \alpha_{7}=0.45, \alpha_{1}=0.20$).
- **Historical Analysis Engine**: Percentile distributions (p25, median, p75, p90), volatility standard deviation, tariff rankings, and CSV validation.
- **Persistence**: SQLite (local) / PostgreSQL + TimescaleDB hypertable (production) with automatic column migrations.
- **Security**: Admin route authorization middleware (`verify_admin_access`).

### Frontend Stack (Next.js 16 / TypeScript / Tailwind CSS)
- **UI Aesthetic**: Dark/Light mode Bloomberg Terminal-inspired FinTech Aviation Control Center.
- **Global Selectors**: Data Mode Switcher (`?mode=live|historical|combined`) & Date Range Selector (24h, 7d, 30d, 90d, 1y).
- **Pages Implemented**:
  - `/` (Command Center Overview & Interactive Map)
  - `/mospi` (MoSPI Macroeconomic Inflation Portal)
  - `/dgca` (DGCA Governance & Surge Alert Matrix)
  - `/forecast` (Traveller Fare Trajectory & Booking Advice)
  - `/historical` (Historical Distribution Analytics & Percentile Rankings)
  - `/data` (Dataset Registry & Provenance Audit Trail)
  - `/admin` (Historical CSV Import Wizard & Bulk Sweep Control Panel)
  - `/methodology` (Econometric Formulae & Jevons Documentation)

---

## 🎙️ How to Explain VAYU to Friends & Judges (Presentation Script)

When demonstrating VAYU to friends or SIH judges, follow this **10-Step Winning Demo Flow**:

1. **The Hero View**: Open `http://localhost:3000/`. Point to the top bar showing **National Airfare CPI (Base 2024 = 100)**. Explain that airfare inflation is now calculated mathematically like the Consumer Price Index!
2. **Full India Map**: Show the interactive map of India with 30 airport nodes. Point out how green nodes represent live data, blue nodes represent historical baseline data, and gray outlines represent unobserved nodes.
3. **Airport & Corridor Search**: Type `DEL` or `Patna` into the search box. Hover over the `DEL → BOM` corridor to display current fare, Jevons index, stress score, and data freshness.
4. **Data Mode Switcher (The Hero Feature)**: Click **`LIVE ONLY`** to show live market state. Then click **`HISTORICAL ONLY`** to show historical tariff coverage. Finally click **`LIVE + HISTORICAL`** to show current fares against multi-year baselines. Show how all numbers update dynamically!
5. **Benchmark Comparison Card**: Scroll to the **Current Market vs Historical Baseline** card (`DEL → BOM`). Show current fare (e.g. ₹6,074) vs historical median (e.g. ₹5,120) and deviation (+18.6%).
6. **MoSPI Portal (`/mospi`)**: Click **MoSPI Portal** in the navigation bar. Show the daily composite CPI line chart and click **Export Official MoSPI CSV**.
7. **DGCA Surge Matrix (`/dgca`)**: Click **DGCA Matrix**. Show the 2x2 Regulatory Risk Matrix and Herfindahl-Hirschman Index (HHI) carrier dominance metrics.
8. **Historical Analytics (`/historical`)**: Open `/historical`. Show the fare distribution histogram, 25th/50th/75th/90th percentiles, and airline rankings.
9. **Dataset Registry (`/data`)**: Open `/data`. Point to the dataset registry table proving full traceability and data provenance.
10. **Admin Portal (`/admin`)**: Open `/admin`. Show the **Bulk Live Collection Control Panel** and click **RUN LIVE SWEEP NOW** to demonstrate live multi-horizon data gathering across 22 corridors!

---

## 📜 Project Commit History Summary

- **Commit 1**: Initial production ingestion pipeline and Railway deployment.
- **Commit 2**: Econometric Jevons engine and Base 2024 normalization layer.
- **Commit 3**: FinTech Aviation Command Center dashboard visual overhaul.
- **Commit 4**: Dynamic live API integration and surge alert detector.
- **Commit 5 (Current)**: Full India interactive map, Three explicit Data Modes (`LIVE`, `HISTORICAL`, `COMBINED`), Admin Import Wizard, Dataset Registry (`/data`), Historical Distribution Analytics (`/historical`), Bulk Collection Sweep Panel (`/admin`), and 100% verified test suite.
