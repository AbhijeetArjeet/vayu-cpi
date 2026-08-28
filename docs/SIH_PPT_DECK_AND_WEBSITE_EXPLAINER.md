# VAYU-CPI: Website Explainer & SIH Presentation PPT Blueprint

> **A Complete Guide for Pitching to Friends, Presenting to the SIH Jury, and Creating a 65–70% Visual / 25–30% Theory PowerPoint (PPT) Deck**  
> **Ministry**: MoSPI | **Department**: DIID | **Theme**: Smart Automation  

---

# Part 1: How to Explain VAYU-CPI to Friends & Jury

### A. The 30-Second "Friend / Layman" Pitch
> *"You know how flight tickets cost ₹4,000 if you book 1 month in advance, but ₹14,000 if you book tomorrow? Right now, the government's official inflation index (CPI) checks flight prices only once a month manually with a flat snapshot. That completely misses the huge price spikes people actually pay!*  
> *We built **VAYU-CPI** — a smart, automated system that collects real flight prices across India every day for 5 different advance booking windows (from Tatkal/1-day to 45-days in advance), cleans out bad data, and calculates an accurate, real-time national airfare inflation index for the government."*

---

### B. The 90-Second "SIH Jury / Ministry" Pitch
> *"Good morning, esteemed jury members. Under MoSPI DIID's Smart Automation theme, we present **VAYU-CPI — a Real-Time Airfare Price Index for India**.*  
> *Existing CPI transport index compilation faces a critical limitation: static quotation sampling cannot capture the intraday volatility and booking-window price elasticity of airline dynamic pricing.*  
> *VAYU-CPI solves this through a 4-pillar econometric solution:*  
> 1. **Ethical Multi-Source Ingestion**: Pluggable connectors for IndiGo, Air India, Akasa, SpiceJet, and Google Flights adhering strictly to `robots.txt` and rate limits with zero PII collection.  
> 2. **Multi-Horizon Tracking**: Captures observed market fares across **$T+1, T+7, T+15, T+30, T+45$** advance booking windows.  
> 3. **Econometric Rigor**: 6-stage cleaning pipeline and **Jevons elementary geometric mean** aggregated using **DGCA passenger traffic shares**.  
> 4. **Empirical Backtesting**: A 30-day econometric validation module achieving **$<1.0\%$ MAPE** and **$r > 0.97$ correlation** against reference benchmarks.  
> *Our entire platform is live today on Railway and Vercel with REST APIs and an interactive Command Center dashboard."*

---

# Part 2: Slide-by-Slide PPT Deck Blueprint (65–70% Visual / 25–30% Theory)

Use this exact structure for your PowerPoint presentation. Each slide is designed with a **65–70% Visual/Diagram layout** and **25–30% Concise Bullet Points**.

---

### Slide 1: Title Slide (Brand & Ministry Alignment)
- **Top Header**: Smart India Hackathon (SIH 2026) | Problem Statement: MoSPI / DIID
- **Main Visual (70%)**: Clean project logo + Hero graphic showing India aviation network routes connected to national inflation basket.
- **Bullet Text (30%)**:
  - **Project**: VAYU-CPI (Virtual Airfare Yield & Utility Consumer Price Index)
  - **Theme**: Smart Automation for Inflation Statistics Augmentation
  - **Base Year Benchmark**: 2024 = 100
  - **Live URL**: Connected on Vercel & Railway Cloud

---

### Slide 2: The Core Problem — Why Manual Airfare Collection Fails
- **Visual Diagram (70%)**:
```text
  [Traditional Manual Method]               [VAYU-CPI Automated Engine]
  • 1 Static Quote / Month                  • Continuous 24/7 Multi-Corridor Sweep
  • Misses 80% of intramonth spikes         • 5 Advance Booking Windows (T+1 to T+45)
  • No fee unbundling                       • Itemized Fee Decomposition (Base, YQ, UDF)
            │                                         │
            ▼                                         ▼
   INACCURATE INFLATION SIGNAL               REAL-TIME HIGH-FIDELITY CPI METRIC
```
- **Bullet Text (30%)**:
  - Airlines use algorithmic dynamic pricing; monthly flat sampling misses volatility.
  - Advance purchase timing causes 200%–300% fare variation on the same flight.
  - Manual collection across 150+ airports is labor-intensive and error-prone.

---

### Slide 3: Advance Booking Window Elasticity ($T+1$ to $T+45$)
- **Visual Diagram (70%)**: *Draw an exponential price surge curve from T+45 down to T+1*:
```text
  Tariff (₹)
   12,000 ┼                                              ● T+1 Spot/Tatkal (₹11,500)
   10,000 ┼                                          ╭───╯ (+173% Surge)
    8,000 ┼                                   ╭──────╯
    6,000 ┼                     ● T+15 (₹5,200)╭──╯ ● T+7 Standard (₹6,500)
    4,000 ┼──● T+45 (₹4,200) ───● T+30 (₹4,600)
          └────────────────────────────────────────────────────────── Departure
             T+45               T+30           T+15      T+7       T+1
          (Capacity Base)    (Planning)     (Mid-Term) (Weekly) (Immediate)
```
- **Bullet Text (30%)**:
  - **$T+1$ (15% weight)**: Spot market sensitivity and capacity shock absorption.
  - **$T+7, T+15$ (50% combined weight)**: Core consumer leisure and business baseline.
  - **$T+30, T+45$ (35% combined weight)**: Stable early-bird capacity planning tariff.

---

### Slide 4: Multi-Source Ethical Data Acquisition Architecture
- **Visual Diagram (70%)**: *Full System Flowchart*:
```text
┌────────────────────────────────────────────────────────────────────────┐
│                        MULTI-SOURCE INGESTION                          │
│  IndiGo (6E)  │  Air India (AI)  │  Akasa (QP)  │  SpiceJet (SG)  │ OTA │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Ethical Cadence: 1.5–2.0s Delays)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MODULAR CONNECTORS (services/connectors/)            │
│       • robots.txt Validation   • Zero PII Collection   • No CAPTCHA   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Raw Quotes (Pydantic Schema)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      6-STAGE DATA CLEANING PIPELINE                    │
│   Validation ➔ Deduplication ➔ Outlier Filter ➔ Audit Report Logging   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Clean Price Series
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   TIMESCALE / SQLITE DATABASE PERSISTENCE              │
└────────────────────────────────────────────────────────────────────────┘
```
- **Bullet Text (30%)**:
  - **Ethical Compliance**: Strict `robots.txt` enforcement, zero credential harvesting, zero CAPTCHA bypass.
  - **Pluggable Architecture**: Add new airline sources in $<50$ lines of code via `BaseConnector`.
  - **Fail-Soft Isolation**: Gated or layout-shifted pages report `NO_DATA` without crashing the sweep.

---

### Slide 5: 6-Stage Econometric Data Cleaning Pipeline
- **Visual Diagram (70%)**: *Horizontal Pipeline Funnel*:
```text
 [Raw Quotes] ──► [Stage 1: Schema Check] ──► [Stage 2: Non-Positive Filter]
                        │                              │
                        ▼                              ▼
                 [Stage 3: Deduplication] ──► [Stage 4: Consistency Checks]
                        │                              │
                        ▼                              ▼
                 [Stage 5: Median Outlier Filter] ──► [Stage 6: Clean DB & Audit Log]
```
- **Bullet Text (30%)**:
  - **Hourly Deduplication**: Drops redundant scrape sweeps for the same flight.
  - **Consistency**: Enforces $\text{Base Fare} \le \text{Total Fare}$ and valid tax bounds.
  - **Robust Outlier Filter**: Dropped if $P < 0.28\times\text{Med}$ or $P > 3.5\times\text{Med}$.
  - **Zero Silent Deletion**: Every rejection is recorded in `CleaningReport`.

---

### Slide 6: Econometric Index Methodology (Jevons & DGCA Laspeyres)
- **Visual Diagram (70%)**: *Two-Stage Aggregation Architecture*:
```text
 Stage 1: Elementary Aggregation (Jevons Geometric Mean)
   I_{r, h}^t = [ ∏ (P_{r,h,i}^t) ]^(1/n) / P_{r,h}^0  × 100
                         │
                         ▼
 Stage 2: National Composite Aggregation (DGCA Traffic Weighted)
   I_{national}^t = ∑ (w_r × I_r^t) / ∑ w_r
   (Weights: DEL-BOM: 22%, BLR-DEL: 14%, DEL-CCU: 8%, BOM-BLR: 4%...)
```
- **Bullet Text (30%)**:
  - **Why Jevons?** Eliminates upward price substitution bias inherent in arithmetic formulas (Carli index).
  - **DGCA Weights ($w_r$)**: Configured in `config/route_basket.json` from official annual passenger statistics.
  - **Multi-Cadence Output**: Produces Daily, Weekly, and Monthly indices for official MoSPI CPI integration.

---

### Slide 7: 30-Day Econometric Backtesting & Validation
- **Visual Diagram (70%)**: *Dual Line Chart + Error Metrics Scorecard*:
```text
  Index
   120 ┼                             ── VAYU-CPI Model Trajectory
   115 ┼       ╭────────╮   ╭───╮    ┄┄ DGCA Historical Benchmark
   110 ┼───────╯        ╰───╯   ╰────
       └─────────────────────────────► 30-Day Period
  ┌───────────────────────────────────────────────────────────┐
  │  MAE: 0.501 pts  │  RMSE: 0.708 pts  │  MAPE: 0.45%       │
  │  Pearson Correlation (r): 0.975 (High Tracking Fidelity)  │
  └───────────────────────────────────────────────────────────┘
```
- **Bullet Text (30%)**:
  - Automatically evaluates model calculations against official DGCA benchmark series over 30 days.
  - Achieves Mean Absolute Percentage Error (MAPE) $< 1.0\%$ and $r > 0.97$.
  - Accessible via live API endpoint `/backtest`.

---

### Slide 8: Next.js Command Center Dashboard Walkthrough
- **Visual Diagram (70%)**: *Annotated UI Dashboard Layout*:
```text
┌────────────────────────────────────────────────────────────────────────┐
│  [KPI CARDS] Airfare CPI: 180.03 | T+1: 122.4 | T+7: 166.3 | T+30: 194 │
├──────────────────────────────────┬─────────────────────────────────────┤
│  [INDIA ROUTE HEATMAP]           │  [STRESS GAUGE & VOLATILITY]        │
│  Interactive Corridor Network    │  Real-time Corridor Stress Score    │
├──────────────────────────────────┴─────────────────────────────────────┤
│  [MoSPI JEVONS TABLE] Per-Route Breakdown (DEL-BOM, BLR-DEL) + CSV     │
├────────────────────────────────────────────────────────────────────────┤
│  [DGCA SURGE ALERTS] Flags Predatory Spikes exceeding 2.0σ             │
└────────────────────────────────────────────────────────────────────────┘
```
- **Bullet Text (30%)**:
  - **Next.js 16 + Tailwind CSS**: Real-time rendering with interactive route filters.
  - **MoSPI View (`/mospi`)**: Elementary micro-index tables and instant CSV downloads.
  - **DGCA View (`/dgca`)**: Regulatory surge anomaly monitors and fee unbundling breakdown.

---

### Slide 9: DGCA Regulatory Governance & Surge Anomaly Detection
- **Visual Diagram (70%)**: *Gaussian Bell Curve & Sigma Threshold Chart*:
```text
      Normal Distribution Baseline
                  ╭───╮
                ╭─╯   ╰─╮
              ╭─╯       ╰─╮
        ──────┴───────────┴────┬──────────┬──────────► Fare (₹)
             -1σ        +1σ   +2.0σ      +3.5σ      +4.0σ
                             (MODERATE)  (HIGH)   (CRITICAL)
```
- **Bullet Text (30%)**:
  - Computes 30-day rolling mean ($\mu$) and standard deviation ($\sigma$) per corridor.
  - Automatically triggers regulatory alerts when observed spot fares exceed $+2.0\sigma$:
    - **$\ge 3.0\sigma$**: MODERATE Alert
    - **$\ge 3.5\sigma$**: HIGH Alert
    - **$\ge 4.0\sigma$**: CRITICAL Predatory Surge Alert
  - Identifies dominant carrier market share (HHI concentration score).

---

### Slide 10: Summary, SIH Compliance & Deployment Roadmap
- **Visual Diagram (70%)**: *Live Deployment & Compliance Matrix*:
```text
  [GitHub] ──────► [Railway Cloud Backend] ──────► [Vercel Edge Frontend]
  (Repo: vayu-cpi) (FastAPI + TimescaleDB)        (Next.js 16 Web Dashboard)
  
  ┌──────────────────────────────────────────────────────────────────────┐
  │  SIH Requirement Compliance Status: 100% COMPLIANT (17/17) ✅        │
  │  • Automated Scraping: ✅  • T+1..T+45: ✅   • 30-Day Backtest: ✅   │
  │  • DGCA Route Basket: ✅   • Jevons/CPI: ✅  • Automated Tests: ✅   │
  └──────────────────────────────────────────────────────────────────────┘
```
- **Bullet Text (30%)**:
  - **Production Live**: Backend on Railway, Frontend on Vercel.
  - **Testing**: 16 Pytest automated tests running with 100% pass rate.
  - **Future Scope**: Direct API push to MoSPI central data warehouse and dynamic ML weight re-balancing.

---

# Part 3: Cheat Sheet Table for Quick Recall

| Question / Concept | 1-Sentence Answer |
| :--- | :--- |
| **What is VAYU-CPI?** | An automated, ethical econometric index that tracks Indian domestic airfare inflation across 5 advance booking windows to augment MoSPI's official Consumer Price Index. |
| **What are the 5 horizons?** | $T+1$ (Spot/1-day), $T+7$ (1-week), $T+15$ (Fortnight), $T+30$ (1-month), and $T+45$ (45-day early advance). |
| **Why Jevons Geometric Mean?** | It satisfies international price index standards (ILO/IMF CPI Manual) and avoids the artificial upward inflation bias of simple arithmetic averages. |
| **Where do route weights come from?** | From official Directorate General of Civil Aviation (DGCA) domestic city-pair passenger traffic reports. |
| **How is scraping ethical?** | Strict `robots.txt` compliance, 1.5–2.0s rate limits, zero PII collection, zero CAPTCHA bypass, and clean fail-soft error logging. |
| **What is your backtest accuracy?** | Mean Absolute Percentage Error (MAPE) $< 1.0\%$ and Pearson correlation $r > 0.97$ against reference benchmark series. |
