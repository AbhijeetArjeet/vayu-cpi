# VAYU-CPI Data Dictionary & Schema Specification

Detailed schema documentation for the `fare_observations` database and API data models.

---

## 1. `fare_observations` Table / Schema

| Field Name | Type | Description | Example / Allowed Values | Nullable |
| :--- | :--- | :--- | :--- | :---: |
| `id` | Integer | Auto-increment primary key | `1042` | No |
| `origin` | String(3) | Origin airport IATA code | `DEL`, `BOM`, `BLR` | No |
| `destination` | String(3) | Destination airport IATA code | `BOM`, `CCU`, `HYD` | No |
| `carrier` | String(64) | Operating airline marketing name | `IndiGo`, `Air India` | No |
| `carrier_code` | String(8) | IATA/ICAO airline designator code | `6E`, `AI`, `QP`, `SG` | No |
| `flight_number` | String(32) | Flight identification code | `6E-205`, `AI-102` | No |
| `departure_date` | String(16) | Flight departure date (YYYY-MM-DD) | `2026-09-15` | Yes |
| `departure_time` | String | Departure date & scheduled time | `2026-09-15 08:30:00` | No |
| `collection_timestamp`| String | ISO timestamp of observation | `2026-08-28T22:30:00` | Yes |
| `scraped_at` | String | Ingestion timestamp for indexing | `2026-08-28T22:30:00` | No |
| `horizon_days` | Integer | Advance booking days (1, 7, 15, 30, 45)| `7` | No |
| `booking_window` | String(16) | Standardized booking window code | `T+1`, `T+7`, `T+15`, `T+30`, `T+45` | No |
| `fare_class` | String(32) | Passenger cabin fare class | `Economy`, `Business` | No |
| `base_fare` | Float | Airline base tariff (INR) | `3550.00` | Yes |
| `taxes` | Float | Total statutory taxes and GST (INR) | `650.00` | Yes |
| `fuel_surcharge_yq` | Float | Fuel charge / YQ surcharge (INR) | `600.00` | Yes |
| `airport_fee_udf` | Float | User Development Fee / PSF (INR) | `650.00` | Yes |
| `udf` | Float | Alias for airport development fee | `650.00` | Yes |
| `convenience_fee` | Float | Portal / payment convenience fee | `300.00` | Yes |
| `total_fare` | Float | Observed all-inclusive passenger price | `5100.00` | No |
| `currency` | String(8) | ISO Currency code | `INR` | No |
| `availability_status` | String(16)| Flight seat availability | `AVAILABLE`, `SOLD_OUT`, `CANCELLED` | No |
| `is_modeled` | Boolean | True if fee breakdown is estimated | `true`, `false` | No |
| `source` | String(64) | Originating source portal / adapter | `Google Flights Live Feed` | No |
| `source_url` | String(256)| Originating query URL | `https://...` | Yes |
| `source_type` | String(64) | Provenance type tag | `LIVE_FLIGHT`, `DGCA_REFERENCE`, `SIMULATED` | No |
| `is_live` | Boolean | True for real-time scraped quotes | `true`, `false` | No |
| `is_historical` | Boolean | True for historical benchmark quotes | `true`, `false` | No |

---

## 2. Fare Component Observability

The following table clarifies which fare fields are **directly observed** from the data source versus **modeled/estimated** by the `unbundler.py` module using fixed constants.

When `is_modeled = true`, the fee breakdown fields are synthetic estimates, not values scraped from the source.

| Field | Observed or Modeled? | Notes |
| :--- | :---: | :--- |
| `total_fare` | **Observed** | Directly scraped from Google Flights or OTA search results. This is the only fare value that reflects real market pricing. |
| `base_fare` | Modeled | Estimated by `unbundler.py` as `total_fare - (UDF + convenience_fee + fuel_surcharge_yq)`. Uses fixed fee constants, not airline-reported breakdowns. |
| `taxes` | Modeled | Computed as `total_fare - base_fare`. Not independently observed. |
| `fuel_surcharge_yq` | Modeled | Fixed constant (₹600) applied by `unbundler.py`. Not scraped from source. |
| `airport_fee_udf` | Modeled | Airport-specific constant from a hardcoded lookup table in `unbundler.py` (e.g., DEL=₹650, BOM=₹650, BLR=₹580). Not scraped. |
| `convenience_fee` | Modeled | Fixed constant (₹300) applied by `unbundler.py`. Not scraped from source. |

> **Key takeaway**: Only `total_fare` is a real observed market price. All sub-component fields (`base_fare`, `taxes`, `fuel_surcharge_yq`, `airport_fee_udf`, `convenience_fee`) are estimates produced by the unbundling model and should be treated as approximate breakdowns, not ground-truth values. The `is_modeled` flag on each record indicates when this estimation has been applied.
