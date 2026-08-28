# SIH 2026 Compliance & Requirement Mapping

**Project**: VAYU-CPI — Real-Time Airfare Price Index for India  
**Ministry**: Ministry of Statistics and Programme Implementation (MoSPI)  
**Department**: Data Informatics & Innovation Division (DIID)  
**Category**: Software  
**Theme**: Smart Automation  

---

## 1. Compliance Matrix

| SIH Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Airline Price Collection** | Multi-source connector architecture (`IndiGoConnector`, `AirIndiaConnector`, `AirIndiaExpressConnector`, `AkasaConnector`, `SpiceJetConnector`, `OTAConnector`) querying domestic city pairs. | ✅ Implemented |
| **OTA Collection** | Google Flights production pipeline connector and Amadeus GDS secondary connector with rate limiting & fail-soft isolation. | ✅ Implemented |
| **Advance Horizon T+1** | Spot / 1-day advance booking window price tracking, Jevons micro-index, and surge alerts. | ✅ Implemented |
| **Advance Horizon T+7** | 1-week advance booking window standard reference horizon tracking and Jevons micro-index. | ✅ Implemented |
| **Advance Horizon T+15** | Fortnight advance booking window tracking and Jevons micro-index. | ✅ Implemented |
| **Advance Horizon T+30** | 1-month advance booking window planning horizon tracking and Jevons micro-index. | ✅ Implemented |
| **Advance Horizon T+45** | 45-day long advance purchase horizon tracking and Jevons micro-index. | ✅ Implemented |
| **Data Cleaning Pipeline** | 6-stage pipeline: Schema validation, Non-positive fare filter, Same-hour deduplication, Consistency checks, Median-ratio outlier detection, Sold-out flight status tracking with audit logging. | ✅ Implemented |
| **Route Basket** | Configurable representative basket (`config/route_basket.json`) covering top domestic corridors weighted by DGCA passenger volume. | ✅ Implemented |
| **Weighted Index Aggregation** | Laspeyres/Young index aggregating route Jevons micro-indices with DGCA passenger traffic volume shares and horizon weights. | ✅ Implemented |
| **Daily, Weekly, Monthly Indices** | Dedicated API endpoints (`/index/daily`, `/index/weekly`, `/index/monthly`) for micro-tracking and official macro CPI integration. | ✅ Implemented |
| **Interactive Dashboard** | Next.js Command Center with KPI cards, 30-day index trend, route price trends, sector heatmap, horizon elasticity, fee decomposition, and surge monitoring. | ✅ Implemented |
| **REST API** | FastAPI backend exposing `/health`, `/routes`, `/carriers`, `/fares`, `/index`, `/index/daily`, `/index/weekly`, `/index/monthly`, `/backtest` with OpenAPI Swagger docs. | ✅ Implemented |
| **Automated Testing** | Pytest test suite (`tests/test_vayu.py`) testing schemas, cleaning, outliers, weighting, Jevons calculator, backtester, connectors, and API endpoints. | ✅ Implemented |
| **30-Day Backtesting** | Econometric backtesting module (`services/engine/backtester.py`) evaluating 30-day series against reference benchmarks with MAE, RMSE, MAPE, and Pearson $r$. | ✅ Implemented |
| **Official MoSPI & DGCA Data Sources** | Transparent documentation of official reference sources (MoSPI e-Sankhyiki, DGCA city-pair traffic returns) and clear distinction of simulated/modeled data. | ✅ Implemented |
| **Ethical Scraping Compliance** | robots.txt compliance, rate-limiting delays, zero PII collection, zero credential harvesting, zero CAPTCHA bypass, graceful error handling. | ✅ Implemented |

---

## 2. Terminology Standardization

All components of VAYU-CPI strictly adhere to official forward-looking advance purchase terminology:

- **T+1**: Flight 1 day from collection date (Spot / Tatkal)
- **T+7**: Flight 7 days from collection date (1-Week Standard)
- **T+15**: Flight 15 days from collection date (Fortnight Advance)
- **T+30**: Flight 30 days from collection date (1-Month Planning)
- **T+45**: Flight 45 days from collection date (45-Day Long Advance)

---

## 3. Data Integrity & Provenance Classification

| Classification | Meaning in VAYU-CPI |
| :--- | :--- |
| **Official / Reference** | Data published by MoSPI e-Sankhyiki or DGCA passenger traffic reports. |
| **Scraped Market Data** | Live observed all-inclusive passenger tariffs collected via ethical connector pipelines. |
| **Derived / Modeled** | Econometric index calculations (Jevons micro-index, Laspeyres composite) or unbundled fee breakdowns. |
| **Simulated / Demo** | Transparently labeled benchmark datasets used for backtesting calibration or offline demonstration. |
