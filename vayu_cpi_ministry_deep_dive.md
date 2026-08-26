# VAYU-CPI: Deep-Dive Guide for PPT Creators & Pitch Presenters
**Project Title:** VAYU-CPI (SIH26056) — Real-Time Airfare Price Index for India  
**Target Audience:** Hackathon PPT Designers, Pitch Speakers, and Technical Presenters  

---

## 📖 PART 1: The 3 Real-World Stories (Copy & Adapt for PPT Slides)

### Story 1: "The ₹25,000 Chhath Puja Flight" (Why MoSPI Needs Real-Time CPI)
> **The Situation:** Ramesh works in Bangalore as a software engineer. Every year during Chhath Puja, he flies home to Patna. A normal economy ticket costs ₹5,200. But 3 days before the festival, demand spikes, and airlines' dynamic pricing algorithms automatically jack the ticket price up to **₹24,800 — a 376% increase!**  
> 
> **The Traditional Government Problem:** Official MoSPI survey officers collect airfare data manually once a month on fixed sample dates. If their survey happens on the 5th of the month, they record ₹5,200. They completely miss the festival inflation spike happening on the 20th. When the monthly CPI numbers are published 45 days later, official transport inflation is reported as 1.2%, while real citizen out-of-pocket transport inflation was over 40%!  
> 
> **The VAYU-CPI Fix:** VAYU-CPI ingests flight prices every 6 hours across $T-30, T-7,$ and $T-1$ spot horizons. MoSPI gets an instant, volume-weighted Jevons-Laspeyres Index that captures real dynamic pricing shocks, giving the Reserve Bank of India (RBI) and government economists exact, un-lagged inflation data.

---

### Story 2: "The Emergency Evacuation Gouging" (Why DGCA Needs Automated 3-Sigma Alerts)
> **The Situation:** During sudden crises — such as the Odisha train accident, Mumbai floods, or airline fleet groundings — train routes get suspended, and thousands of desperate travelers rush to book emergency flights. Sensing extreme demand, dynamic pricing algorithms push a 2-hour flight price from ₹4,000 to ₹35,000 within hours.  
> 
> **The Traditional Government Problem:** DGCA (Civil Aviation Regulator) receives complaints via social media and news reports days after the crisis. Regulators have no automated dashboard to verify whether a ₹35,000 fare is a statistical anomaly or normal pricing. By the time they issue manual inquiries, airlines have already collected windfall profits.  
> 
> **The VAYU-CPI Fix:** VAYU-CPI’s **3-Sigma Anomaly Engine** compares current fares against each route's 30-day rolling baseline. If a fare spikes beyond $3.0\sigma$ above normal, the system instantly flags a `CRITICAL` alert on the DGCA Matrix. DGCA officials can immediately trigger statutory price caps under Rule 135 of the Aircraft Rules, 1937.

---

### Story 3: "The Jet Fuel (ATF) Domino Effect" (Why Policy Simulation Matters)
> **The Situation:** Global crude oil prices rise, increasing Aviation Turbine Fuel (ATF) costs by 15%. ATF makes up ~25-40% of an airline’s operating expenses. Airlines immediately pass this cost to consumers, but no one knows how much it will drive overall national inflation.  
> 
> **The Traditional Government Problem:** Policy makers in the Finance Ministry and MoSPI have to guess the ripple effect of fuel price hikes on consumer inflation using slow, theoretical models.  
> 
> **The VAYU-CPI Fix:** VAYU-CPI includes an **Interactive Macro Policy Simulator**. Economists can slide an ATF Fuel Hike toggle (e.g. $+20\%$) or Festival Demand Surge slider and instantly see the simulated impact on the National Airfare CPI in real time.

---

## 🏛️ PART 2: Deep Dive — Ministry #1: MoSPI
*(Ministry of Statistics and Programme Implementation)*

### Who is MoSPI?
MoSPI is the primary statistical body of the Government of India. They calculate:
1. **Consumer Price Index (CPI)** — The official measure of retail inflation in India.
2. **Gross Domestic Product (GDP) Deflator** — Used to convert nominal GDP into real GDP.
3. **Dearness Allowance (DA) & Pension Indexing** — Dictates salary adjustments for millions of central government employees.

### Why does MoSPI need VAYU-CPI data?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WHY MoSPI NEEDS VAYU-CPI                              │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ Traditional Method (Slow & Flawed)    │ VAYU-CPI Advantage                      │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ 45-day survey collection lag          │ 6-hour real-time automated ingestion    │
│ Fixed price assumption (no horizons)  │ Tracks T-30 (Advance), T-7, T-1 (Spot)  │
│ Equal weighting of all routes         │ DGCA volume-weighted Laspeyres index    │
│ No scenario testing capabilities      │ Interactive ATF/Demand Policy Simulator │
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

### What does MoSPI DO with this data? (Step-by-Step Workflow)

```text
Step 1: Automated Data Fetch ──► VAYU-CPI API generates daily volume-weighted CPI.
                                         │
Step 2: MoSPI Integration ─────► One-click CSV export (/api/v1/cpi/export/csv) injected 
                                 into National Accounts Statistics (NAS) database.
                                         │
Step 3: Inflation Reporting ───► Transport CPI sub-index updated daily instead of monthly.
                                         │
Step 4: RBI Monetary Policy ───► Reserve Bank of India (RBI) Monetary Policy Committee 
                                 uses un-lagged CPI to adjust repo rates & interest policy.
```

---

## ✈️ PART 3: Deep Dive — Ministry #2: DGCA & Ministry of Civil Aviation
*(Directorate General of Civil Aviation)*

### Who is DGCA?
DGCA is the regulatory authority for civil aviation in India. Under **Rule 135 of the Aircraft Rules, 1937**, airlines must establish reasonable airfares having regard to the cost of operation, service features, and reasonable profit.

### Why does DGCA need VAYU-CPI data?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WHY DGCA NEEDS VAYU-CPI                               │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│ Traditional Method (Slow & Flawed)    │ VAYU-CPI Advantage                      │
├───────────────────────────────────────┼─────────────────────────────────────────┤
│ Manual complaints after events        │ Automated 3-Sigma real-time alert feed  │
│ Opaque "all-in" ticket prices         │ Statutory Fee Unbundling (Base, YQ, UDF)│
│ No visibility into route monopolies   │ Herfindahl-Hirschman Concentration (HHI)│
└───────────────────────────────────────┴─────────────────────────────────────────┘
```

### What does DGCA DO with this data? (Step-by-Step Workflow)

```text
Step 1: 3-Sigma Anomaly Trigger ──► Fare on DEL-PAT exceeds 3.0σ above 30-day baseline.
                                            │
Step 2: Automated Alert ──────────► DGCA Matrix displays CRITICAL alert + Carrier Dominance.
                                            │
Step 3: Fee Unbundling Audit ────► DGCA inspects if spike is driven by Base Fare 
                                    or unjustified Fuel Surcharge / UDF markup.
                                            │
Step 4: Regulatory Action ────────► Show-Cause notice issued under Aircraft Rules Rule 135 
                                    to cap fares and protect passengers.
```

---

## 🎨 PART 4: Cheat-Sheet for PPT Designers (Slide-by-Slide Ideas)

| Slide Topic | Key Diagram / Visual Idea | Text Bullet Points for Slide |
|:---|:---|:---|
| **Title Slide** | Clean dark background, Airplane Icon with glowing pulse, "VAYU-CPI" title | Real-Time Airfare Price Index for India (SIH26056) |
| **The Problem** | Split graphic: 🐢 **Turtle (Old CPI 45-day lag)** vs ⚡ **Lightning (Dynamic 6-hr airfares)** | • 45-day delay in CPI calculations<br>• Misses festival & emergency price surges<br>• Opaque ticket fee structures |
| **The Solution** | Architecture Diagram (Track 1 $\to$ Track 2 $\to$ Track 3) | • 100% Live Ingestion from Google Flights<br>• Statutory Fee Unbundling ($YQ, UDF$)<br>• Jevons & Laspeyres Econometric Engine |
| **MoSPI Portal** | Screenshot of `/mospi` AreaChart + Policy Simulator | • Daily Retail Transport CPI<br>• Horizon Sub-Indices ($T-30, T-7, T-1$)<br>• What-If ATF Policy Simulator |
| **DGCA Matrix** | Screenshot of `/dgca` 3-Sigma Alerts + Stacked Bar Chart | • Automated 3-Sigma Surge Detection<br>• Severity Badges (`CRITICAL`, `HIGH`, `MODERATE`)<br>• HHI Monopoly Concentration Audit |
| **Impact & Future** | Icons of Indian Railways (Vande Bharat), Inter-city Buses, Regional UDAAN | • Prevents airline predatory pricing<br>• Empowers RBI with accurate inflation data<br>• Scalable to all Indian public transport modes |
