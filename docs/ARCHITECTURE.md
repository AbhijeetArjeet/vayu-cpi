# System Architecture & Technical Design

VAYU-CPI is architected around a high-throughput, ethical, and modular multi-tier data pipeline designed for high statistical integrity.

---

## 1. High-Level Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                 AIRLINE & OTA DATA SOURCES                  │
│   (IndiGo, Air India, Air India Express, Akasa, SpiceJet)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Ethical Cadence / Rate Limited)
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
│   (fare_observations, dataset_registry)                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Query Service
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
│       REST API ENGINE        │    │    NEXT.JS COMMAND CENTER    │
│   FastAPI (OpenAPI / Swagger)│    │   Interactive Charts, Heatmap│
│   /health, /routes, /index   │    │   DGCA Governance, SkyView 3D│
└──────────────────────────────┘    └──────────────────────────────┘
```

---

## 2. Directory Structure

```text
├── config/
│   └── route_basket.json           # Configurable DGCA route weights & horizons
├── core/
│   ├── schemas.py                  # Pydantic schemas (RawFareRecord, CPI models, Backtest)
│   ├── dgca_weights.py             # Route basket loader, horizon alphas, airport coordinates
│   └── env_diag.py                 # Startup environment diagnostics & secret sanitizer
├── services/
│   ├── ingestion/
│   │   ├── connectors/             # Pluggable modular source connectors
│   │   │   ├── base.py             # BaseConnector abstract class
│   │   │   ├── indigo_connector.py # IndiGo connector
│   │   │   ├── air_india_connector.py
│   │   │   ├── ota_connector.py    # Google Flights / OTA aggregator
│   │   │   └── ...
│   │   ├── live_fetcher.py         # Multi-corridor scraping engine
│   │   ├── scheduler.py            # APScheduler automated 6-hour sweep
│   │   └── unbundler.py            # Fee decomposition model
│   ├── engine/
│   │   ├── normalizer.py           # 6-stage data cleaning & outlier removal
│   │   ├── index_calculator.py     # Jevons micro-index & national composite engine
│   │   ├── backtester.py           # 30-day econometric backtesting & error metrics
│   │   ├── anomaly_detector.py     # DGCA predatory surge detector (2.0σ threshold)
│   │   └── seed_base_2024.py       # Base Year 2024 reference tariffs
│   ├── persistence/
│   │   └── db.py                   # TimescaleDB / SQLite ORM models & seeders
│   └── api/
│       ├── main.py                 # FastAPI application root & standard SIH endpoints
│       ├── routes_cpi.py           # MoSPI macroeconomic index endpoints
│       ├── routes_dgca.py          # DGCA regulatory surge monitoring
│       ├── routes_data.py          # Dataset registry & historical analytics
│       └── routes_admin.py         # Dataset import & pipeline administration
├── web/                            # Next.js 16 React Dashboard
│   ├── app/                        # App router pages (MoSPI, DGCA, Routes, SkyView, Data)
│   ├── components/                 # Reusable UI charts, gauges, heatmaps
│   └── lib/                        # API client & analytics utilities
└── tests/
    └── test_vayu.py                # Pytest automated test suite
```
