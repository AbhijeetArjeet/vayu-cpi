# VAYU-CPI (SIH26056)

Real-time airfare price index for India, augmenting MoSPI's CPI with a
volume-weighted Jevons-Laspeyres index computed from live domestic
airfares (Base 2024 = 100).

## Status

**Built so far:**
- Part 1 -- ingestion + econometric engine (this is what's implemented):
  - `core/schemas.py` -- shared Pydantic data contracts
  - `core/dgca_weights.py` -- DGCA route traffic weights + horizon alphas
  - `services/ingestion/live_fetcher.py` -- **primary** live ingestion via
    `fast-flights` (Google Flights live production backend)
  - `services/ingestion/amadeus_fetcher.py` -- **optional** secondary
    connector, only usable with a *production* (not test/sandbox)
    Amadeus for Developers key
  - `services/ingestion/scheduler.py` -- APScheduler-driven periodic sweep
  - `services/persistence/db.py` -- SQLAlchemy models + TimescaleDB hypertable setup
  - `services/engine/normalizer.py` -- dedup + outlier stripping
  - `services/engine/index_calculator.py` -- Jevons micro-index + national composite CPI
- Part 2 -- backend API (implemented) + frontend (not yet built):
  - `services/api/main.py`, `routes_cpi.py`, `routes_dgca.py` -- FastAPI, all
    routes verified to register and respond correctly (tested with
    `TestClient`, see below)
  - `web/` -- Next.js 14 dashboard: **scaffolded directory only, not yet built**

## Honesty notes -- read before a live demo or submission

1. **Amadeus test/sandbox credentials will not give you live data.** The
   free Amadeus for Developers tier serves static cached data from
   ~2017-2021 and rejects near-term dynamic dates. `amadeus_fetcher.py`
   deliberately no-ops unless `AMADEUS_HOSTNAME=production` is set, so it
   can't silently pollute the index with stale data mislabeled as live.
   Default to `live_fetcher.py` (fast-flights) unless you've gone through
   Amadeus's production approval process.

2. **`fast-flights` scrapes Google Flights' internal protocol, not an
   official API.** It can break without warning if Google changes their
   response format, and it doesn't return a real itemized fee breakdown
   -- the base/YQ/UDF/convenience split in `live_fetcher.py` is an
   approximation using documented statutory fee slabs, not data Google
   actually returns. Say this plainly if judges ask "is this real data" --
   the *total fare* is real and live; the *decomposition* of that total
   is a modeled estimate.

3. **DGCA route weights (`core/dgca_weights.py`) are estimated**, not
   pulled live from a DGCA API (no such public API exists at this
   granularity). They're derived from DGCA's periodically published
   sector-wise traffic reports. Re-derive them from the latest quarterly
   report before treating the index as submission-ready, and cite the
   specific report/quarter you used.

4. **The base period (2024) requires actual 2024 fare observations in the
   database** for the Jevons index to be computable -- `index_calculator.py`
   returns `None`/a neutral 100.0 placeholder when that's missing (see
   docstrings), rather than fabricating a number. If you don't have
   historical 2024 fare data, you'll need to either backfill it from
   another source or clearly relabel the base period to whenever your
   collection actually started.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, optionally Amadeus creds
docker compose up -d db   # or point DATABASE_URL at your own Postgres/TimescaleDB
uvicorn services.api.main:app --reload --port 8000
# in another terminal:
python -m services.ingestion.scheduler
```

Visit `http://localhost:8000/docs` for interactive API docs once the
server is running.

## Next steps

- Build the Next.js 14 + Tailwind + Recharts dashboard (`web/`) against
  the now-working API (MoSPI portal at `/mospi`, DGCA portal at `/dgca`)
- Backfill or synthesize a documented 2024 base-period dataset
- Swap the estimated DGCA weights for figures cited from a specific
  published DGCA report
