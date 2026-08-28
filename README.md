# VAYU-CPI — Real-Time Airfare Price Index for India

> **Development of a Real-time Airfare Price Index for India through Automated Web Scraping of Airline and Online Travel Aggregator Portals for Augmentation of the Consumer Price Index (CPI)**

**Smart India Hackathon (SIH)**
- **Ministry**: Ministry of Statistics and Programme Implementation (MoSPI)
- **Department**: Data Informatics & Innovation Division (DIID)
- **Category**: Software
- **Theme**: Smart Automation
- **Base Year Benchmark**: 2024 = 100

---

## 1. Problem Statement & Motivation

### Why Existing Manual Airfare Collection is Insufficient
Currently, statistical authorities face severe challenges in capturing air travel pricing for the Consumer Price Index (CPI) transport commodity basket:
1. **High Volatility & Dynamic Pricing**: Airfares fluctuate continuously based on demand surges, advance purchase timing, and algorithmic revenue management systems. Manual periodic quotation sampling fails to capture intramonth price dynamics.
2. **Advance Purchase Elasticity**: Ticket prices vary drastically depending on when a ticket is purchased relative to flight departure (e.g. T+1 vs T+7 vs T+45). A single static spot price distorts inflation estimates.
3. **Unbundled Ancillary Fees**: Base airfares are frequently separated from airport fees (UDF/PSF), fuel charges (YQ), and convenience charges.
4. **Geographic Coverage**: India's domestic aviation network spans hundreds of city pairs; manual observation across all major trunk corridors is labor-intensive and error-prone.

### The VAYU-CPI Solution
VAYU-CPI is an automated, ethical, econometric airfare indexing platform that:
- Periodically gathers observed airfares across representative Indian domestic corridors.
- Systematically collects prices across **5 standardized advance purchase booking windows**:
  - **T+1**: Spot / Immediate (1 day before departure)
  - **T+7**: Standard 1-Week Advance
  - **T+15**: Fortnight Advance
  - **T+30**: 1-Month Planning Horizon
  - **T+45**: 45-Day Long Advance Purchase
- Cleans and deduplicates quotes via a 6-stage econometric normalization pipeline.
- Calculates transparent elementary micro-indices (Jevons Geometric Mean) and aggregates them into a National Composite Airfare Price Index (APIx) weighted by official **DGCA Passenger Traffic Statistics**.
- Provides a 30-day econometric backtesting engine, REST APIs for downstream consumption, and an interactive command center dashboard.

---

## 2. Implementation Status

| Capability / Feature | Status | Notes |
| :--- | :---: | :--- |
| **Airline Price Ingestion** | ✅ | Multi-connector architecture for IndiGo, Air India, Akasa, SpiceJet, Air India Express |
| **OTA & Meta-Search Collection** | ✅ | Production pipeline with rate-limiting, fail-soft isolation, and consent-handling |
| **Advance Booking Horizons** | ✅ | Full support for `T+1`, `T+7`, `T+15`, `T+30`, `T+45` throughout backend and frontend |
| **Data Cleaning & Normalization** | ✅ | Deduplication, invalid fare rejection, median-ratio outlier filter, audit report logging |
| **Configurable Route Basket** | ✅ | `config/route_basket.json` loaded dynamically with DGCA passenger volume shares |
| **Econometric Index Calculation** | ✅ | Jevons micro-indices, horizon sub-indices, carrier indices, national Laspeyres composite |
| **Index Cadence** | ✅ | Daily (`/index/daily`), Weekly (`/index/weekly`), and Monthly (`/index/monthly`) series |
| **30-Day Backtesting Module** | ✅ | Error metrics (MAE, RMSE, MAPE, Pearson $r$) against DGCA reference benchmark |
| **REST API Engine** | ✅ | FastAPI with OpenAPI/Swagger docs (`/health`, `/routes`, `/carriers`, `/fares`, `/index`, `/backtest`) |
| **Interactive Dashboard** | ✅ | Next.js 16 command center with KPI cards, time series, route matrix, 3D SkyView |
| **Automated Testing Suite** | ✅ | 16 comprehensive Pytest tests covering all econometric, cleaning, and API modules |
| **Ethical Scraping Safeguards** | ✅ | Strict robots.txt compliance, rate-limiting, zero PII, zero CAPTCHA bypass |
| **Amadeus GDS Live Ingestion** | ⚠️ | Enterprise production adapter ready; test sandbox data restricted |

*Legend: ✅ Implemented | ⚠️ Prototype / Limited-Source | 🧪 Experimental | 📌 Planned*

---

## 3. Official Data Sources

### Official / Reference Sources
1. **MoSPI e-Sankhyiki Portal**: https://esankhyiki.mospi.gov.in/  
   *Reference standard for national CPI transport basket weighting and methodology guidelines.*
2. **Directorate General of Civil Aviation (DGCA)**: https://www.dgca.gov.in/  
   *Official domestic city-pair passenger movement statistics used for route basket weighting ($w_r$).*

### Ingested Market Sources
- **Google Flights Production Feed**: Live observed passenger tariffs across domestic routes.
- **Amadeus GDS Adapter**: Enterprise GDS itemized quote interface.

### Data Classification
- **Official / Reference**: DGCA statistical city-pair traffic returns and baseline tariffs.
- **Scraped Market Data**: Live observed prices gathered via ethical connectors.
- **Derived / Modeled**: Jevons geometric mean indices, composite Laspeyres weights, and unbundled fee models.
- **Simulated / Demo**: Clearly labeled synthetic test benchmarks used for offline calibration and backtesting.

---

## 4. End-to-End Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 AIRLINE & OTA DATA SOURCES                  │
│   (IndiGo, Air India, Air India Express, Akasa, SpiceJet)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Ethical Rate Limits)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 MODULAR SOURCE CONNECTORS                   │
│   (BaseConnector, IndiGoConnector, OTAConnector, etc.)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ Raw Quotes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               ECONOMETRIC CLEANING PIPELINE                 │
│   1. Schema & Currency Validation                           │
│   2. Non-positive Price Filter                              │
│   3. Same-Flight Hourly Deduplication                       │
│   4. Base-Total Consistency Checks                          │
│   5. Outlier Detection (Tukey IQR / Median Ratio Filter)    │
│   6. Sold-Out Flight Status Audit Logging                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Clean Price Series
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE PERSISTENCE                    │
│   PostgreSQL / TimescaleDB Hypertable & SQLite Fallback     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 INDEX CALCULATION ENGINE                    │
│   - Jevons Elementary Route Micro-Index                     │
│   - Advance Horizon Blending (T+1, T+7, T+15, T+30, T+45)   │
│   - DGCA Passenger Traffic Weighted Laspeyres Aggregation   │
│   - Carrier Sub-Indices & Market Concentration              │
│   - 30-Day Backtesting Engine (MAE, RMSE, MAPE, Pearson r)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌──────────────────────────────┐
│       FASTAPI REST API       │    │    NEXT.JS COMMAND CENTER    │
│   /health, /routes, /index   │    │   Interactive Charts, Heatmap│
│   /index/daily, /backtest    │    │   DGCA Governance, SkyView 3D│
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 5. Mathematical Methodology

### 1. Jevons Elementary Micro-Index
For route $r$ and advance booking horizon $h \in \{1, 7, 15, 30, 45\}$:

$$I_{r, h}^t = \frac{\left( \prod_{i=1}^{n_{r,h}} P_{r, h, i}^t \right)^{1/n_{r,h}}}{P_{r, h}^0} \times 100$$

### 2. Horizon Blended Route Micro-Index
$$I_r^t = \frac{\sum_{h} \alpha_h \cdot I_{r, h}^t}{\sum_{h} \alpha_h}$$

Where:
- $\alpha_1 = 0.15$ (T+1 Spot / 1-Day Advance)
- $\alpha_7 = 0.25$ (T+7 1-Week Advance)
- $\alpha_{15} = 0.25$ (T+15 Fortnight Advance)
- $\alpha_{30} = 0.20$ (T+30 1-Month Advance)
- $\alpha_{45} = 0.15$ (T+45 45-Day Advance)

### 3. National Composite Laspeyres Aggregation
$$I_{\text{national}}^t = \frac{\sum_{r \in R_{\text{observed}}} w_r \cdot I_r^t}{\sum_{r \in R_{\text{observed}}} w_r}$$

Where $w_r$ represents DGCA domestic passenger traffic shares configured in `config/route_basket.json`.

---

## 6. 30-Day Backtesting & Validation

VAYU-CPI includes a built-in backtesting engine (`services/engine/backtester.py`) evaluating index trajectories against benchmark series:
- **MAE** (Mean Absolute Error): $\frac{1}{N} \sum |y_i - \hat{y}_i|$
- **RMSE** (Root Mean Squared Error): $\sqrt{\frac{1}{N} \sum (y_i - \hat{y}_i)^2}$
- **MAPE** (Mean Absolute Percentage Error): $\frac{100}{N} \sum \left|\frac{y_i - \hat{y}_i}{y_i}\right|$
- **Pearson Correlation ($r$)**: High tracking fidelity ($r > 0.95$).

Access results via `GET /backtest` or `GET /api/v1/backtest`.

---

## 7. How to Run

### Prerequisites
- Python 3.10+ (tested on Python 3.10, 3.11, 3.14)
- Node.js 18+ and npm
- Optional: PostgreSQL / TimescaleDB (falls back automatically to SQLite `vayu_test.db`)

### 1. Backend Service (FastAPI)
```bash
# Install backend dependencies
pip install -r requirements.txt

# Start FastAPI application
uvicorn services.api.main:app --reload --port 8000
```
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Airfare Index: http://localhost:8000/index
- Backtest: http://localhost:8000/backtest

### 2. Frontend Dashboard (Next.js)
```bash
# Navigate to web directory
cd web

# Install frontend dependencies
npm install

# Start Next.js development server
npm run dev
```
- Dashboard: http://localhost:3000

### 3. Running Automated Tests
```bash
# Run the complete test suite from repository root
python -m pytest tests/
```

### 4. Running the Scraper / Ingestion Pipeline Manually
```bash
# Run single multi-corridor sweep
python -m services.ingestion.live_fetcher

# Run continuous background scheduler (every 6 hours)
python -m services.ingestion.scheduler
```

### 5. Docker Deployment
```bash
# Build and run using Docker Compose
docker-compose up --build
```

---

## 8. Limitations & Future Scope

### Current Limitations
1. **Dynamic Airline Layouts**: Airline websites occasionally update client-side JavaScript structures; fallback adapters ensure continuous fail-soft operation.
2. **Ancillary Breakdown Availability**: Not all public web quotes expose explicit fee unbundling without initiating a simulated booking session; where itemized breakdowns are absent, total observed fares are preserved and unbundled components are labeled as derived/modeled.

### Future Scope
1. Direct integration with MoSPI DIID enterprise data warehouse via automated API push.
2. Machine learning dynamic route weighting based on monthly live passenger load factor data.
3. Multi-currency international corridor expansion for SAARC and ASEAN sectors.

---

## 9. Documentation Index

- [`docs/SIH_COMPLIANCE.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/SIH_COMPLIANCE.md) — Comprehensive SIH requirement mapping
- [`docs/ARCHITECTURE.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/ARCHITECTURE.md) — Detailed pipeline and software architecture
- [`docs/DATA_DICTIONARY.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/DATA_DICTIONARY.md) — Complete database and API schemas
- [`docs/DATA_SOURCES.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/DATA_SOURCES.md) — Official MoSPI/DGCA sources and provenance
- [`docs/ETHICAL_SCRAPING.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/ETHICAL_SCRAPING.md) — Ethical safeguards, rate-limiting, and compliance
- [`docs/INDEX_METHODOLOGY.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/INDEX_METHODOLOGY.md) — Mathematical index formulas and weights
- [`docs/BACKTESTING.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/BACKTESTING.md) — 30-day backtesting methodology and error metrics
- [`docs/API.md`](file:///c:/sih2026/NAFPI%20%28National%20Airfare%20Price%20Index%29/docs/API.md) — Complete REST API reference and parameters
