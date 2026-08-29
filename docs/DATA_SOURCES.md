# Official Data Sources & Provenance Registry

VAYU-CPI maintains strict provenance tracking across all data inputs.

---

## 1. Official Reference Sources

### MoSPI e-Sankhyiki Portal
- **URL**: https://esankhyiki.mospi.gov.in/
- **Role in Project**: Primary macroeconomic benchmark and CPI transport commodity basket reference.
- **Usage**: Reference weights for transport sub-group indexing and base-year comparison standards.

### Directorate General of Civil Aviation (DGCA) & Ministry of Civil Aviation (MoCA)
- **URL**: https://www.dgca.gov.in/
- **Role in Project**: Official Domestic City-Pair Passenger Traffic Statistics and Parliamentary Tariff Returns.
- **Reference Dataset**: `data/reference/dgca_domestic_fares_reference.csv`
- **Usage**: Used to establish representative route basket weights ($w_r$), airline concentration benchmarks, and baseline tariffs ($P^0_{r,h}$) for Laspeyres-Jevons index compilation and empirical backtesting (`mode="real_dgca"`).

---

## 2. Live Market Ingestion & Validation Sources

### 2a. Primary Ingestion Feed: Google Flights (via SerpAPI)
- **Connector**: `live_fetcher.py` → all carrier and OTA connectors (as honest fallback)
- **Status**: ✅ **WORKING — Primary live data source**
- **Method**: SerpAPI Google Flights endpoint (authorized commercial API)
- **Coverage**: All domestic Indian carriers (IndiGo, Air India, SpiceJet, Akasa, Air India Express, Vistara, etc.)
- **Data**: Real-time fare prices, carrier names, flight numbers, departure times
- **Observed field**: `total_fare` (directly observed market price)
- **Provenance**: `portal = "Google Flights"`, `source = "Google Flights Live Feed"`, `is_ota_direct = True`

> **Why Google Flights?** Google has commercial agreements with all Indian domestic carriers and OTAs. This is the same data source used by professional aviation analytics platforms. It provides genuine, real-time market prices without violating any site's robots.txt or Terms of Service.

### 2b. Secondary Cross-Validation Feed: Independent Flight Fare API (RapidAPI)
- **Connector**: `services/ingestion/connectors/secondary_fare_api_connector.py` (`SecondaryFareAPIConnector`)
- **Status**: 🔄 **ACTIVE — Optional Independent Cross-Check Feed**
- **Role**: Used exclusively for price consistency cross-validation (`/cross-validation` and `services/engine/cross_validation.py`), NOT directly blended into the primary national index calculation.
- **Method**: RapidAPI Flight Fare Search API (`flight-fare-search.p.rapidapi.com` / configurable)
- **Authentication**: Configured via `SECONDARY_FARE_API_KEY` environment variable. Fails closed (returns `[]`) if key is absent.
- **Free Tier Guardrails**: Conservative 3.0s delay between requests; daily quota budget capped at 20 calls/day (`SECONDARY_FARE_API_DAILY_LIMIT`) to preserve free-tier request limits.

---

## 3. Per-Source Status Table

### 3a. Airline Carrier Sources

| Source | Carrier Code | Independent Scraper? | Status | Reason |
|:---|:---:|:---:|:---|:---|
| **IndiGo** | 6E | ❌ No | Google Flights proxy (filtered by carrier) | `robots.txt` disallows `/content/goindigo/en/home/flight-booking/`, `/api/`, and `/*?*` (all URLs with query params). Akamai Bot Manager blocks non-browser clients. NDC API requires IATA agency certification. |
| **SpiceJet** | SG | ❌ No | Google Flights proxy (filtered by carrier) | `robots.txt` disallows `/search/`, `/flight/select/`. Cloudflare/AWS WAF blocks automated requests. Next.js SPA — no fare data in static HTML. |
| **Akasa Air** | QP | ❌ No | Google Flights proxy (filtered by carrier) | `robots.txt` disallows `/booking/`, `/api/`. Cloudflare Bot Management active. Navitaire/Radixx backend requires JS execution. |
| **Air India** | AI | ❌ No | Google Flights proxy (filtered by carrier) | `robots.txt` disallows `/search-results/`, `/api/`, `/in/en/book/`. Amadeus Altéa booking engine behind authentication. |
| **Air India Express** | IX | ❌ No | Google Flights proxy (filtered by carrier) | `robots.txt` disallows `/booking/`, `/api/`. Same bot protection pattern as Air India. |

### 3b. Online Travel Agency (OTA) Sources

| Source | Code | Independent Scraper? | Status | Reason |
|:---|:---:|:---:|:---|:---|
| **Cleartrip** | CT | ❌ No | Google Flights fallback (honestly labeled) | `robots.txt` disallows `/flights/results` (the exact search results URL). DataDome/Cloudflare WAF returns HTTP 403. Commercial SaaS API available at saasdoc.cleartrip.com for authorized partners only. |
| **EaseMyTrip** | EMT | ❌ No | Google Flights fallback (honestly labeled) | `robots.txt` disallows `/FlightList/` (the flight search endpoint). Partner API available for registered B2B businesses only. Fare data injected via client-side AJAX. |
| **MakeMyTrip** | MMT | ❌ No | Google Flights fallback (honestly labeled) | `robots.txt` disallows `/flight/search`, `/api/`. Most aggressive bot detection (PerimeterX). JS-heavy SPA with no fare data in static HTML. |

### 3c. Not Attempted (Out of Scope)

| Source | Reason |
|:---|:---|
| **Ixigo** | Flagged as follow-up; same robots.txt/bot-protection pattern expected |
| **Goibibo** | Flagged as follow-up; owned by MakeMyTrip, same infrastructure |
| **Amadeus GDS** | Production access requires commercial enterprise licensing agreement |

---

## 4. How the Dual-Feed Architecture Works

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VAYU-CPI Ingestion & Validation Architecture    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [ Primary Production Feed ]                [ Secondary Validation ]   │
│  Google Flights via SerpAPI                 RapidAPI Secondary Feed    │
│  (live_fetcher.py)                          (secondary_fare_api)       │
│        │                                                │              │
│        ▼                                                ▼              │
│  ┌──────────────────────────┐               ┌────────────────────────┐ │
│  │ Primary Fare Observations│               │ Secondary Observations │ │
│  │ (Live Market Database)   │               │ (Cross-Validation DB)  │ │
│  └─────────────┬────────────┘               └───────────┬────────────┘ │
│                │                                        │              │
│                ▼                                        ▼              │
│  ┌──────────────────────────┐               ┌────────────────────────┐ │
│  │ VAYU-CPI Laspeyres-Jevons│               │ Cross-Validation Engine│ │
│  │ National Composite Index │               │ (/cross-validation)    │ │
│  │ (Base 2024 = 100)        │               │ Price Agreement Check  │ │
│  └─────────────┬────────────┘               └────────────────────────┘ │
│                │                                                       │
│                ▼                                                       │
│  ┌──────────────────────────┐                                          │
│  │ DGCA Empirical Backtest  │                                          │
│  │ (/backtest?mode=real_dgca│                                          │
│  └──────────────────────────┘                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Classification Standard

Every observation in the VAYU-CPI database is explicitly categorized:

1. **`LIVE_FLIGHT`**: Real-time market observations collected via Google Flights / SerpAPI or Secondary Validation APIs.
2. **`DGCA_REFERENCE`**: Historical benchmark tariffs from official DGCA / MoCA parliamentary returns (`data/reference/dgca_domestic_fares_reference.csv`).
3. **`SIMULATED`**: Transparently labeled synthetic datasets used for offline testing, calibration, and math stability self-checks.
4. **`DERIVED`**: Unbundled fee decompositions or econometric index aggregations.

---

## 6. Why Independent Direct Airline/OTA Scraping Is Not Implemented

This is a deliberate, responsible engineering decision, not a capability gap:

1. **robots.txt compliance**: All 8 airline/OTA sites explicitly disallow automated access to flight search/results pages. Our `BaseConnector.respect_robots_txt = True` policy requires honoring these directives.
2. **Terms of Service**: Multiple carriers (IndiGo, SpiceJet, Air India) have ToS clauses prohibiting automated data collection from their websites.
3. **Bot protection**: All sites use enterprise-grade bot detection (Akamai, Cloudflare, DataDome, PerimeterX) that blocks automated clients including headless browsers.
4. **Ethical framework**: The VAYU-CPI ethical scraping policy (documented in `docs/ETHICAL_SCRAPING.md`) prohibits CAPTCHA solving, login bypass, and routing around security measures.
5. **Legitimate alternative exists**: Google Flights via SerpAPI provides the same fare data through an authorized commercial API, with full carrier coverage and real-time pricing.
