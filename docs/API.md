# VAYU-CPI REST API Reference

The VAYU-CPI backend is built with FastAPI and provides high-performance asynchronous endpoints with full OpenAPI 3.0 / Swagger documentation.

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 1. Core Endpoints

### `GET /health`
Returns service health and version information.
```json
{
  "status": "ok",
  "service": "vayu-cpi-api",
  "version": "1.0.0",
  "sih_theme": "Smart Automation (MoSPI)"
}
```

### `GET /routes`
Returns all monitored domestic corridors, city pairs, and airport metadata.

### `GET /carriers`
Query parameters: `mode` (`live`, `historical`, `combined`)  
Returns carrier price indices, sample counts, and market share distributions.

### `GET /fares`
Query parameters:
- `origin` (e.g. `DEL`)
- `destination` (e.g. `BOM`)
- `carrier` (e.g. `6E`, `AI`)
- `booking_window` (`T+1`, `T+7`, `T+15`, `T+30`, `T+45`)
- `mode` (`live`, `historical`, `combined`)
- `limit` (default: 100)

### `GET /index`
Returns National Composite Airfare Price Index (Base 2024 = 100), daily/weekly/monthly change %, and all 5 booking window sub-indices (`spot_sub_index` for T+1, `week_sub_index` for T+7, `fortnight_sub_index` for T+15, `advance_sub_index` for T+30, `long_advance_sub_index` for T+45).

### `GET /index/daily`
Query parameters: `days_back` (1 to 365, default: 30), `mode`  
Returns daily composite airfare price index time series.

### `GET /index/weekly`
Query parameters: `weeks_back` (1 to 52, default: 12), `mode`  
Returns weekly smoothed airfare price index time series.

### `GET /index/monthly`
Query parameters: `months_back` (1 to 36, default: 12), `mode`  
Returns monthly aggregated airfare price index time series for MoSPI macro CPI publication.

### `GET /backtest`
Query parameters: `mode` (`historical`, `combined`)  
Returns 30-day econometric backtesting metrics (MAE, RMSE, MAPE, Pearson correlation) and daily comparative trajectory.

---

## 2. Governance & Data Registry Endpoints

- `GET /api/v1/dgca/surge-alerts`: Active predatory surge alerts (>2.0σ price deviation).
- `GET /api/v1/dgca/decomposition`: Itemized fee breakdowns (Base, YQ, UDF, Convenience fee).
- `GET /api/v1/coverage`: National domestic airport and route coverage statistics.
- `GET /api/v1/data/datasets`: Registered live, historical, and reference datasets.
- `GET /api/v1/cpi/export/csv`: Streams CSV export for MoSPI macroeconomic pipelines.
