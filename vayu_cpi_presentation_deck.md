# VAYU-CPI: Hackathon Presentation & Pitch Deck Kit
**Project Title:** VAYU-CPI — Real-Time Airfare Price Index for India  
**Hackathon Problem Statement:** SIH26056 (Augmenting Consumer Price Index with Real-Time Airfare Tracking)  
**Live Demo:** [https://vayu-cpi.vercel.app](https://vayu-cpi.vercel.app)  
**Backend API:** [https://web-production-e5a43.up.railway.app](https://web-production-e5a43.up.railway.app)  

---

## 🎭 1. The Opening Hook & Relatable Story (30-Second Opener)

> *"Imagine Diwali week. Millions of Indians are booking tickets to fly home to see their families. Overnight, a ₹5,000 Delhi-to-Patna ticket surges to ₹22,000 — a 340% jump!*  
> 
> *Meanwhile, MoSPI (Ministry of Statistics) is calculating official inflation numbers using manual, once-a-month survey sampling that won't reflect this surge for another 45 days. By the time official CPI data comes out, the festival is over, citizens have overpaid, and DGCA regulators had zero real-time visibility to intervene.*  
> 
> *Good morning judges. We present **VAYU-CPI** — India’s first Real-Time, Volume-Weighted Airfare Price Index that bridges macroeconomic policy with live dynamic market pricing."*

---

## ❓ 2. The Core Problem Statement

| Current CPI Limitation | Impact on Economy & Citizens |
|:---|:---|
| **45-Day Data Lag** | Official MoSPI Consumer Price Index (CPI) relies on manual monthly physical surveys, missing sudden price shocks. |
| **Dynamic Pricing Blindspot** | Airline ticket prices change every 6 hours based on booking horizon ($T-30$ advance vs $T-1$ spot tatkal). Fixed monthly surveys treat a flight ticket like a fixed-price commodity. |
| **Opaque Fee Bundling** | Ticket aggregators display "all-in" prices, obscuring how much is base fare vs. statutory Fuel Surcharges ($YQ$) and Airport User Development Fees ($UDF$). |
| **Regulatory Inertia (DGCA)** | Without automated anomaly detection, DGCA regulators cannot distinguish normal seasonal shifts from predatory surge pricing or carrier duopoly gouging. |

---

## 🚀 3. The Solution: VAYU-CPI

**VAYU-CPI** is an end-to-end, decoupled 3-track micro-architecture that scrapes live flight data across major domestic trunk corridors, unbundles fees using statutory government slabs, computes elementary geometric mean micro-indices ($Jevons$), aggregates them into a volume-weighted national composite index ($Laspeyres$), and serves dual government personas via dedicated web portals.

---

## ⭐ 4. Unique Selling Proposition (USP)

1. **100% Live Ingestion (No Sandboxes/Fake Data)**: Scrapes real, live domestic flight quotes directly from Google Flights every 6 hours across $6$ major trunk corridors ($DEL-BOM, BOM-DEL, BLR-DEL, DEL-CCU, DEL-PAT, BOM-GOI$) and $3$ booking horizons ($T-30, T-7, T-1$).
2. **Statutory Fee Unbundling Engine**: Decomposes total all-in ticket prices into Base Fare, Fuel Surcharge ($YQ=₹600$), Airport UDF ($DEL=₹650, BLR=₹580, CCU=₹480, PAT=₹350, GOI=₹390$), and Convenience Fee ($₹300$).
3. **Rigorous Econometric Standard**: Uses international statistical standards (ILO/IMF CPI Manual) — elementary $Jevons$ geometric mean micro-indices aggregated via DGCA passenger volume weights ($W$) and horizon weights ($\alpha_{30}=0.35, \alpha_7=0.45, \alpha_1=0.20$).
4. **3-Sigma Automated Regulatory Alerting**: Flags routes where current fares exceed $3.0\sigma$ above their rolling 30-day baseline, categorizing severity into `CRITICAL` ($\ge 4.0\sigma$), `HIGH` ($\ge 3.5\sigma$), and `MODERATE` ($\ge 3.0\sigma$).
5. **Interactive Policy & ATF "What-If" Simulator**: Allows government economists to simulate Jet Fuel (ATF) price shocks or festival demand surges and visualize projected CPI shifts in real time.

---

## 🏛️ 5. Dual-Persona Solution Breakdown

### Persona 1: MoSPI Macroeconomic View (`/mospi`)
- **Target Audience:** Ministry of Statistics & Programme Implementation policy makers.
- **Key Features:**
  - National Composite Airfare CPI (Base 2024 = 100).
  - Horizon Sub-Indices ($T-30$ Advance, $T-7$ Mid, $T-1$ Tatkal Spot).
  - Time-series trend AreaChart with interactive horizon toggles.
  - Official MoSPI CSV Export button formatted for government database injection.
  - Interactive Macro Policy & ATF Simulator.

### Persona 2: DGCA Regulatory Surge Matrix (`/dgca`)
- **Target Audience:** Directorate General of Civil Aviation tariff monitors & anti-monopoly auditors.
- **Key Features:**
  - Active Surge Alert Feed with severity badges.
  - Carrier Dominance Indicator (e.g. `IndiGo 65%`).
  - Stacked Fee Decomposition BarChart (Base vs $YQ$ vs $UDF$ vs Convenience).
  - Herfindahl-Hirschman Index (HHI) Monopoly Concentration Gauge.

---

## 🛠️ 6. Technical Architecture & Tech Stack

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE SCHEMA CONTRACT                            │
│                       `core/schemas.py`                                │
└──────────────┬─────────────────────────┬───────────────────────────────┘
               │                         │
               ▼                         ▼
┌─────────────────────────────┐ ┌────────────────────────────────────────┐
│ TRACK 1: INGESTION PIPELINE │ │ TRACK 2: STORAGE & ECONOMETRIC BACKEND │
│ • `fast-flights` live feed  │ │ • PostgreSQL / TimescaleDB             │
│ • Fee unbundling (YQ/UDF)   │ │ • Jevons micro-index calculator        │
│ • 6-corridor horizon matrix │ │ • DGCA volume-weighted Laspeyres CPI   │
│ • Async scheduler           │ │ • 3-Sigma surge anomaly detector       │
└──────────────┬──────────────┘ │ • FastAPI REST routes (MoSPI/DGCA)     │
               │                └───────────────────┬────────────────────┘
               │ Write to DB                        │ REST Endpoints
               └────────────────► [FastAPI API] ◄───┘
                                       │
                                       ▼
                        ┌─────────────────────────────────┐
                        │ TRACK 3: DUAL-PERSONA DASHBOARD │
                        │ • Next.js 16 App Router         │
                        │ • MoSPI Macro View (2024=100)   │
                        │ • DGCA Surge & Gouging Matrix   │
                        │ • Recharts + Tailwind CSS       │
                        └─────────────────────────────────┘
```

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Recharts, Lucide-React (Deployed on **Vercel**).
- **Backend API:** FastAPI, Pydantic v2, APScheduler (Deployed on **Railway**).
- **Econometric Engine:** NumPy, SciPy, custom Jevons & 3-Sigma algorithms.
- **Database:** PostgreSQL / TimescaleDB hypertable for time-series observations.
- **Testing:** Automated `pytest` suite ($7/7$ tests passing).

---

## 📊 7. Slide-by-Slide PPT Outline

| Slide # | Slide Title | Visual Content / Diagram | Key Speaker Script |
|:---:|:---|:---|:---|
| **1** | **VAYU-CPI** | Title, SIH26056 Logo, Team Name, Subtitle: "Real-Time Airfare Price Index for India" | "Good morning judges. We are presenting VAYU-CPI, a real-time airfare price index to augment India's Consumer Price Index." |
| **2** | **The Problem** | Comparison graphic: 45-day survey lag vs 6-hour dynamic pricing shifts. | "Airfare prices change every hour, but official CPI numbers take 45 days. This leaves MoSPI blind to inflation and DGCA powerless against holiday price gouging." |
| **3** | **The Solution** | High-level 3-Track Architecture Blueprint. | "VAYU-CPI automatically ingests live flight quotes across major Indian corridors, unbundles statutory fees, and calculates an official volume-weighted index every 6 hours." |
| **4** | **Ingestion & Unbundling** | Flowchart of live Google Flights scraping $\to$ Fee Decomposition ($YQ, UDF$). | "We scrape 100% real live prices. We then unbundle the ticket into base fare, fuel surcharge, and airport UDF fees using official DGCA slabs." |
| **5** | **Econometric Rigor** | Mathematical Formulas: $Jevons$ Geometric Mean & $Laspeyres$ Weighting. | "We follow international statistical standards — calculating elementary Jevons micro-indices aggregated by official DGCA passenger volume weights." |
| **6** | **MoSPI Inflation Portal** | Screenshot/Demo of `/mospi` (Composite CPI chart + CSV Export + Policy Simulator). | "For MoSPI economists, we provide real-time CPI trends, advance vs spot sub-indices, an official CSV exporter, and a what-if ATF policy simulator." |
| **7** | **DGCA Regulatory Matrix** | Screenshot/Demo of `/dgca` (3-Sigma Surge Alerts + Stacked Fee Chart + HHI). | "For DGCA regulators, our 3-sigma engine flags artificial fare spikes and monitors carrier monopoly concentration." |
| **8** | **Live System Demo** | Live browser window showing [https://vayu-cpi.vercel.app](https://vayu-cpi.vercel.app). | "Let us demonstrate the live system. Here is today's composite index based on 550+ live quotes collected today." |
| **9** | **Future Scope** | Icons for Indian Railways, Inter-city Buses, Regional UDAAN routes. | "VAYU-CPI can be expanded to cover Vande Bharat trains, interstate buses, and regional UDAAN flight routes for a comprehensive transport CPI." |
| **10** | **Conclusion & Q&A** | Project Repository Link, Thank You Graphic. | "Thank you judges. We are now open for your questions." |

---

## 🎯 8. Expected Judge Q&A Preparation

#### Q1: "Are these prices real or mocked?"
> **Answer:** *"The total ticket prices are 100% real and live, scraped directly from Google Flights across 6 major Indian trunk corridors every 6 hours. The fee decomposition (YQ/UDF) is modeled using official statutory fee slabs published by DGCA/AERA."*

#### Q2: "Why use the Jevons formula instead of simple average?"
> **Answer:** *"Simple arithmetic averages are distorted by extreme outliers (like business class seats). The ILO/IMF CPI Manual recommends the Jevons elementary index — geometric mean — because it treats relative price changes neutrally and handles volatile dynamic pricing without skew."*

#### Q3: "Where do the route weights come from?"
> **Answer:** *"Route weights in `core/dgca_weights.py` are derived from DGCA's quarterly published passenger traffic reports for domestic city pairs (e.g. DEL-BOM carries 26% of top-corridor passenger volume)."*

#### Q4: "How does the 3-Sigma surge detector work?"
> **Answer:** *"It compares a corridor's current average fare against its own rolling 30-day mean and standard deviation. If the current fare exceeds $3.0\sigma$, it triggers a Surge Alert, categorizing severity into Moderate, High, or Critical."*
