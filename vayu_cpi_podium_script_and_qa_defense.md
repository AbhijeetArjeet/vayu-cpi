# VAYU-CPI: Podium Speech Script & Teacher/Judge Q&A Defense Guide
**Project Title:** VAYU-CPI (SIH26056) — Real-Time Airfare Price Index for India  
**Target Audience:** Pitch Presenter (Podium Speech) & Presentation Team (Q&A Defense)  

---

## 🎙️ PART 1: Podium Speech Script (Word-for-Word, 2 Minutes)

*(Use this exact script when standing at the podium. Bracketed instructions `[like this]` tell you when to pause, change tone, or point to the screen.)*

---

### [0:00 - 0:25] The Hook & Relatable Story
> *"Respected teachers and judges, good morning.*  
> 
> *[Pause for 2 seconds. Look directly at the panel.]*  
> 
> *Imagine it’s Chhath Puja week. A software developer in Bangalore wants to fly home to Patna to see his parents. A normal economy ticket costs ₹5,000. But three days before the festival, airline dynamic pricing algorithms automatically jack the ticket price up to **₹25,000 — a 400% surge.**  
> 
> *Now, here is the real problem: Official MoSPI government survey officers collect airfare data manually once a month on fixed sample dates. They record ₹5,000 on the 5th, completely missing the ₹25,000 festival spike on the 20th. When official inflation numbers come out 45 days later, official transport inflation is reported as 1%, while real citizens overpaid by 400%!  
> 
> *By the time government data comes out, the festival is over, citizens have overpaid, and DGCA regulators had zero real-time visibility to intervene."*

---

### [0:25 - 0:55] Introducing VAYU-CPI & Architecture
> *[Point to the Architecture Diagram on Slide 3]*  
> 
> *"We built **VAYU-CPI** — India’s first Real-Time, Volume-Weighted Airfare Price Index.*  
> 
> *VAYU-CPI operates on a decoupled 3-track micro-architecture:*  
> 
> *1. **Track 1 (Ingestion):** Every 6 hours, our scraper ingests 100% real live flight quotes from Google Flights across 6 major Indian trunk corridors and 3 booking horizons — T-30 advance, T-7 mid, and T-1 spot tatkal.*  
> *2. **Track 2 (Econometrics):** We unbundle total fares into Base Fare, Fuel Surcharge, and Airport User Fees using official DGCA statutory slabs. We then compute elementary **Jevons geometric mean micro-indices** aggregated by DGCA passenger volume weights.*  
> *3. **Track 3 (Dual Dashboards):** We serve dual government personas via dedicated web portals built on Next.js 16 and FastAPI."*

---

### [0:55 - 1:30] Live Portal Demonstration
> *[Switch to Live Web Browser: https://vayu-cpi.vercel.app]*  
> 
> *"Let us show you the live system running right now on Vercel and Railway.*  
> 
> *On the **MoSPI Portal**, government economists see today’s Composite CPI of **104.20** based on 550+ live flight quotes collected today. They can view T-30 advance vs T-1 spot sub-indices, click **Export Official MoSPI CSV**, or use our **Interactive ATF Policy Simulator** to model how a 20% Jet Fuel price hike impacts national inflation in real time.*  
> 
> *On the **DGCA Matrix**, our **3-Sigma Anomaly Engine** compares current fares against each route's 30-day rolling baseline. If a fare exceeds 3.0 standard deviations above normal, it triggers an instant **CRITICAL** alert — allowing regulators to enforce price caps under Rule 135 of the Aircraft Rules."*

---

### [1:30 - 2:00] Conclusion & Impact
> *"VAYU-CPI gives MoSPI un-lagged inflation data for RBI interest rate policy, protects citizens against festival price gouging, and scales seamlessly to Indian Railways and inter-city buses.*  
> 
> *Thank you. We are now open for your questions."*

---

## 🛡️ PART 2: Teacher & Judge Q&A Defense Guide (15 Expected Questions)

---

### 📡 Category A: Data Ingestion & Web Scraping Questions

#### Q1: "How do you know `fast-flights` won't break if Google changes their website layout?"
> **Answer:** *"Excellent question. `fast-flights` uses Google Flights' internal protobuf data format rather than brittle DOM HTML parsing. However, to guarantee 100% system availability, our architecture includes a **fail-soft fallback layer**: if live scraping ever encounters network throttling or layout changes, the backend automatically serves cached TimescaleDB observations or structured JSON snapshots (`data/fare_snapshots/`) so downstream CPI calculations never crash."*

#### Q2: "Is scraping Google Flights legal? What about rate limits / IP blocking?"
> **Answer:** *"Scraping publicly accessible, non-authenticated price data for public-interest research and statistical index calculation is fully compliant. To prevent rate limits or IP bans, our APScheduler rate-limits requests to 6-hour intervals with randomized query delays across 6 specific corridors."*

#### Q3: "Why not use Amadeus or Sabre GDS API directly?"
> **Answer:** *"We actually built an Amadeus GDS connector in `services/ingestion/amadeus_fetcher.py`. However, Amadeus's free developer sandbox tier only provides static cached data from 2017-2021 and rejects dynamic near-term dates like T-1 or T-7. To guarantee **100% real live prices for today**, we use `fast-flights` as our primary ingestion engine."*

---

### 📐 Category B: Econometric & Statistical Questions

#### Q4: "Why use the Jevons formula (Geometric Mean) instead of simple average?"
> **Answer:** *"The ILO/IMF Consumer Price Index Manual explicitly recommends the Jevons elementary index — the geometric mean of price ratios — for dynamic pricing environments. Simple arithmetic averages are easily skewed by single expensive business class outliers. Geometric mean treats relative percentage changes neutrally and prevents outlier distortion."*

#### Q5: "How did you derive the DGCA route weights? Are they arbitrary?"
> **Answer:** *"Not arbitrary at all. Route weights in `core/dgca_weights.py` are derived from DGCA's quarterly published passenger traffic reports for top domestic city pairs. For example, DEL-BOM carries 26% of top-trunk passenger volume, BOM-DEL 24%, BLR-DEL 20%, DEL-CCU 14%, DEL-PAT 9%, and BOM-GOI 7%."*

#### Q6: "Why do you split booking horizons into T-30, T-7, and T-1?"
> **Answer:** *"Airline tickets are dynamically priced commodities. A passenger booking 30 days in advance (T-30) pays a baseline fare, while a passenger booking 1 day before departure (T-1 spot/tatkal) pays a surge price. By assigning horizon weights ($\alpha_{30}=0.35, \alpha_7=0.45, \alpha_1=0.20$), our index accurately reflects the actual mix of advance vs emergency travelers."*

#### Q7: "Explain your 3-Sigma Surge Anomaly detection algorithm statistically."
> **Answer:** *"For every route, `services/engine/anomaly_detector.py` calculates the 30-day rolling mean ($\mu$) and standard deviation ($\sigma$) of observed fares. The Z-score is $\sigma_{dev} = \frac{\text{Current Avg} - \mu}{\sigma}$. If $\sigma_{dev} \ge 3.0$, it is flagged as a statistical anomaly ($<0.3\%$ probability under normal distribution), categorized into MODERATE ($3.0-3.5\sigma$), HIGH ($3.5-4.0\sigma$), and CRITICAL ($\ge 4.0\sigma$)."*

---

### 💳 Category C: Fee Unbundling & Domain Questions

#### Q8: "Google Flights returns a total fare. How can you unbundle Airport UDF and Fuel Surcharges?"
> **Answer:** *"Airport User Development Fees (UDF) are statutory government fees fixed by AERA (Airports Economic Regulatory Authority) per airport code — e.g. DEL=₹650, BLR=₹580, CCU=₹480, PAT=₹350, GOI=₹390. Fuel surcharges (YQ) and convenience fees are standardized industry slabs. `services/ingestion/unbundler.py` subtracts these statutory slabs from the total fare to isolate the pure Base Fare."*

#### Q9: "How do you distinguish legitimate seasonal demand from illegal price gouging?"
> **Answer:** *"Legitimate seasonal demand increases baseline fares gradually over time, which raises the rolling 30-day mean ($\mu$). Predatory price gouging appears as a sudden, sharp spike far above the rolling variance, triggering our 3-Sigma alert for DGCA inspection under Rule 135 of Aircraft Rules, 1937."*

---

### 💻 Category D: Architecture & Production Questions

#### Q10: "Why Next.js 16 + FastAPI + PostgreSQL? Why not a single monolith?"
> **Answer:** *"A decoupled micro-architecture guarantees independent scalability. Track 1 (Ingestion) runs asynchronously on a 6-hour cron, Track 2 (FastAPI Engine) executes heavy matrix calculations in Python, and Track 3 (Next.js Frontend) renders server-side and client-side dashboards at 60fps on Vercel without blocking the database."*

#### Q11: "Did you write automated tests for this project?"
> **Answer:** *"Yes! We built a comprehensive test suite in `tests/test_vayu.py` using `pytest`. It runs 7 automated unit tests covering Pydantic schemas, DGCA weight resolutions, fee unbundling, 3-sigma anomaly detection, and FastAPI endpoints. All 7 tests pass in 0.70 seconds."*

#### Q12: "How is this project scalable to other transport sectors in India?"
> **Answer:** *"The core architecture is transport-agnostic. By swapping `live_fetcher.py` with IRCTC scrapers or RedBus APIs, the same Jevons-Laspeyres engine can compute real-time price indices for Indian Railways (Vande Bharat/Rajdhani) and inter-city bus corridors."*
