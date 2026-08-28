# Ethical Data Acquisition & Scraping Safeguards

VAYU-CPI adheres strictly to ethical data collection principles for government-grade statistical systems.

---

## 1. Core Principles & Safeguards

1. **Strict robots.txt Compliance**:
   - Every connector checks website permissions and respects `Disallow:` directives on restricted paths.
2. **Rate Limiting & Polite Request Cadence**:
   - Outbound requests enforce minimum delays (1.5 to 2.0 seconds between queries) to prevent any server load or disruption.
3. **No Private / Authentication Gates**:
   - VAYU-CPI only accesses publicly available route pricing pages. It does not harvest user credentials, session tokens, or private accounts.
4. **Zero Personal Identifiable Information (PII)**:
   - Queries contain zero passenger data (e.g. standard 1 adult search). No passenger profiles, booking history, or identifying information are accessed or stored.
5. **No CAPTCHA Bypass or Anti-Bot Circumvention**:
   - The system does not utilize automated CAPTCHA solvers, proxy rotations to circumvent security barriers, or unauthorized access controls.
6. **Graceful Handling of Gated / Sold-Out Pages**:
   - If an airline page returns an access restriction or layout change, the connector logs a clean `NO_DATA` status rather than issuing aggressive retries.
7. **Clean Adapters & Approved Sources**:
   - Where direct airline web access is not permitted by Terms of Service, VAYU-CPI provides clean pluggable adapters to consume authorized aggregator feeds (e.g. Amadeus GDS) or official benchmark datasets.
8. **Transparent Attribution**:
   - All quotes maintain source attribution (`portal`, `source`, `source_url`, `collection_timestamp`).

---

## 2. Connector Architecture Flow

```text
Airline / OTA Source
       ↓
Source Connector (Rate Limit + Compliance Check)
       ↓
Raw Quote Record (Pydantic Schema Validation)
       ↓
Data Cleaning & Outlier Filter
       ↓
Clean Quote Store (TimescaleDB / SQLite)
       ↓
Index Aggregation Engine
```
