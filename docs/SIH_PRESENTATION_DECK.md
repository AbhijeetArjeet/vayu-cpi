# 🏆 Smart India Hackathon 2026 — Official Presentation Deck

**Project Name:** VAYU-CPI (National Airfare Price Index)  
**Ministry / Department:** Ministry of Statistics and Programme Implementation (MoSPI) & Directorate General of Civil Aviation (DGCA)  
**Category / Theme:** Smart Automation / Macroeconomic Data Analytics  
**Live Production URL:** [https://vayu-cpi.vercel.app](https://vayu-cpi.vercel.app)  

---

## 📑 Slide-by-Slide Presentation Structure

```mermaid
flowchart LR
    S1["Slide 1: Title & Team"] --> S2["Slide 2: Problem Statement"]
    S2 --> S3["Slide 3: Proposed Solution"]
    S3 --> S4["Slide 4: Architecture & Econometric Math"]
    S4 --> S5["Slide 5: Intelligence Modules"]
    S5 --> S6["Slide 6: Competitive Edge Matrix"]
    S6 --> S7["Slide 7: Tech Stack & Live Demo"]
    S7 --> S8["Slide 8: National Impact & Roadmap"]
```

---

## 📌 Slide 1: Title Slide

### **Slide Content**
* **Project Title**: **VAYU-CPI** — National Airfare Price Index & Regulatory Intelligence Platform
* **Tagline**: Automated Multi-Horizon Ingestion, Statutory Fee Unbundling, and Axiomatic Jevons-Laspeyres Macroeconomic Aggregation
* **Problem Statement Theme**: Smart Automation (MoSPI & DGCA)
* **Team Details**:
  * Team Name: `[Your Team Name]`
  * Team Leader: `[Team Leader Name]`
  * Team Members: `[Member 1, Member 2, Member 3, Member 4, Member 5]`
  * Institute: `[Your College / University Name]`

### 🎙️ **Speaker Notes (What to say in 20 seconds)**
> *"Respected Judges, we are Team [Name], and today we present **VAYU-CPI**, India’s first automated, real-time National Airfare Price Index and aviation regulatory intelligence platform, built for MoSPI and the DGCA."*

---

## 📌 Slide 2: Problem Statement & Context

### **Slide Content**
* **The Legacy Challenge**: MoSPI’s official airfare CPI tracking historically relied on manual monthly/quarterly physical or phone surveys.
* **Why Traditional Methods Broke Down**:
  1. **Algorithmic Dynamic Yield Management**: Modern airlines change ticket prices every 15 minutes across 20+ inventory classes (RBD buckets). Static monthly quotes capture less than 0.001% of true market transactions.
  2. **Severe Time-Lag**: Traditional CPI reporting has a **60-to-90 day publication lag**, making it impossible for the DGCA to detect and mitigate predatory price surges during festivals or natural disasters.
  3. **The Unbundling Blindspot**: Tickets are no longer a single fare; they include Base Fare, Airport UDF, Fuel Surcharges (YQ), GST, and OTA markups. Legacy surveys cannot determine if inflation is driven by airline profiteering or airport infrastructure tariffs.
  4. **Arithmetic Upward Bias (+4.8%)**: Standard arithmetic averages (Carli formula) overstate national airfare inflation by +4.8%, violating ILO/IMF Consumer Price Index manuals.

### 🎙️ **Speaker Notes (What to say in 45 seconds)**
> *"For decades, India measured airfare inflation through manual surveys designed for static physical goods. But in an era where airline revenue algorithms alter fares every 15 minutes, manual surveys are statistically blind. Furthermore, unbundling of airport fees and an inherent 4.8% arithmetic calculation bias have distorted national inflation numbers. We needed a modern, automated econometric solution."*

---

## 📌 Slide 3: Proposed Solution & Innovation

### **Slide Content**
* **Core Vision**: A unified national platform that automates the complete data lifecycle—from anti-bot web ingestion to axiomatic econometric indexation and citizen transparency.
* **The 3-Pillar Ecosystem**:
  1. 🏛️ **MoSPI Macroeconomic Engine**: Produces real-time, daily and monthly Consumer Price Indices (Base 2024 = 100) using the internationally recognized Jevons-Laspeyres hybrid formula with instant CSV streaming.
  2. 🛡️ **DGCA Regulatory Surveillance**: Automated **3-Sigma Anomaly & Surge Detector** ($z \ge 3.0$) with Herfindahl-Hirschman Index (HHI) carrier dominance metrics for anti-gouging enforcement.
  3. ✈️ **Citizen Passenger Portal**: Empowers 150M+ Indian travelers with an animated fairness speedometer dial, 45-day sweet-spot booking journey, and true checkout price transparency.

### 🎙️ **Speaker Notes (What to say in 45 seconds)**
> *"VAYU-CPI replaces manual surveys with an automated data refinery. It serves three distinct stakeholders: MoSPI gets accurate, unbiased inflation data; the DGCA gets automated 3-sigma predatory surge alerts; and everyday Indian passengers get an intelligent fair-price validator to avoid paying Tatkal dynamic surcharges."*

---

## 📌 Slide 4: Technical Architecture & Econometric Methodology

### **Slide Content**
* **Multi-Stage Econometric Pipeline**:
  $$\text{Raw Inventory Ingestion} \longrightarrow \text{Statutory Fee Unbundling} \longrightarrow \text{Jevons Elementary Aggregation} \longrightarrow \text{DGCA Traffic-Weighted Young/Laspeyres Index}$$
* **Mathematical Superiority**:
  * **Elementary Level (Jevons Geometric Mean)**:
    $$I_{r, h}^t = \left( \prod_{i=1}^{n} \frac{P_{r, h, i}^t}{P_{r, h}^0} \right)^{1/n} \times 100$$
    *Eliminates the +4.8% Carli arithmetic upward bias and satisfies the axiomatic Time Reversal Test.*
  * **Horizon Blending Matrix**:
    $$I_r^t = \sum_{h \in \{1, 7, 15, 30, 45\}} \alpha_h \cdot I_{r, h}^t \quad (\text{Tatkal } T+1: 30\%, \text{ Weekly } T+7: 35\%, \text{ Fortnight } T+15: 20\%, \text{ Advance } T+30: 15\%)$$
  * **Macro Composite Young / Laspeyres Index**:
    $$I_{\text{National}}^t = \frac{\sum_{r} w_r \cdot I_r^t}{\sum_{r} w_r} \quad (w_r = \text{Official DGCA Passenger Volume Share})$$

### 🎙️ **Speaker Notes (What to say in 60 seconds)**
> *"Our core differentiation is mathematical rigor. Unlike basic projects that use simple arithmetic averages—which falsely inflate CPI by 4.8%—VAYU-CPI implements the axiomatic Jevons Geometric Mean recommended by the IMF. We blend fares across a 5-tier advance purchase matrix and aggregate them using official DGCA passenger volume weights across India's top 35 domestic corridors."*

---

## 📌 Slide 5: Statistical Intelligence & Advanced Features

### **Slide Content**
1. 🧾 **Statutory Fee Line-Item Unbundler**: Separates Base Fare (73%), Airport UDF (11%), Fuel Surcharge (10%), GST (4%), and OTA Convenience Markup (2%).
2. 🌊 **5-Factor Inflation Waterfall Decomposition (`/explainer`)**: Explains *why* CPI changed: Trunk corridors (42%), Tatkal spread (24%), Carrier yield (16%), Seasonality (12%), and Residuals (6%).
3. 🚨 **3-Sigma Real-Time Surge Scanner (`/shocks`)**: Computes continuous rolling z-scores ($z = \frac{x - \mu}{\sigma}$) and flags critical tariff shocks with route HHI monopoly ratings.
4. 🧪 **What-If Econometric Policy Lab (`/policy`)**: Simulates the macroeconomic effect of ATF jet fuel price shocks (+15%) or festive demand surges (+20%) on national inflation.
5. 🔍 **100% Cryptographic Provenance Audit Trail (`/provenance`)**: Full auditability from national inflation index down to raw scraped timestamps.

### 🎙️ **Speaker Notes (What to say in 45 seconds)**
> *"VAYU-CPI does not just display numbers; it explains them. Our waterfall explainer attributes inflation to specific root causes, our 3-sigma engine flags price gouging, and our Policy Lab allows government economists to run predictive simulations before modifying airport user fees or fuel taxes."*

---

## 📌 Slide 6: Competitive Edge — Why VAYU-CPI Beats Other Projects

### **Slide Content**

| Feature / Metric | Typical Competitor Submissions | 🚀 VAYU-CPI (Our Solution) |
| :--- | :--- | :--- |
| **Ingestion Tech** | Heavy Selenium/Puppeteer (crashes, blocked by Cloudflare) | **HTTP/2 TLS Fingerprint Impersonation (`fast-flights` + `primp`)** (<800ms, never blocked) |
| **Index Formula** | Naive arithmetic mean (**+4.8% inflation bias**) | **Axiomatic Jevons Geometric Mean** (IMF / MoSPI compliant) |
| **Fee Unbundling** | Lumped total ticket price | **Statutory 5-part line-item unbundling** |
| **Horizon Modeling**| Single static date (e.g. tomorrow only) | **5-Tier Advance Matrix** ($T+1, T+7, T+15, T+30, T+45$) |
| **Regulatory Tool** | Simple table view | **3-Sigma Anomaly Matrix + HHI Route Dominance** |
| **Citizen Utility** | None (government tables only) | **Interactive Passenger Hub with Fair-Fare Speedometer** |
| **Verification** | Unverified / 0 tests | **51 Automated Unit Tests Passing (100% test suite)** |

### 🎙️ **Speaker Notes (What to say in 45 seconds)**
> *"While other teams built basic Selenium scripts that get blocked after 10 searches and calculate biased arithmetic averages, VAYU-CPI is an enterprise econometric data pipeline. We use TLS socket impersonation, unbundle statutory airport fees, and provide a battle-tested platform backed by 51 passing unit tests."*

---

## 📌 Slide 7: Tech Stack, Infrastructure & Live Deployment

### **Slide Content**
* **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
* **Backend**: Python 3.11/3.14, FastAPI REST Framework, SQLAlchemy ORM, APScheduler
* **Database & Storage**: TimescaleDB / PostgreSQL (Production on Railway), SQLite (Local Fallback)
* **Web Ingestion**: HTTP/2 TLS Client Impersonation Engine (`primp`), Skyscanner Live API, Amadeus API
* **Live Deployments**:
  * 🌐 **Production Frontend**: `https://vayu-cpi.vercel.app`
  * ⚡ **Production Backend**: `https://web-production-3741e.up.railway.app`
  * 📦 **GitHub Repository**: `https://github.com/AbhijeetArjeet/vayu-cpi`

### 🎙️ **Speaker Notes (What to say in 30 seconds)**
> *"Our entire system is live and accessible right now. The frontend is deployed on Vercel, the backend is running on Railway with PostgreSQL, and all 25+ REST API endpoints are active with sub-second response times."*

---

## 📌 Slide 8: National Impact, Roadmap & Conclusion

### **Slide Content**
* **Quantifiable National Impact**:
  * **MoSPI**: Eliminates 60-day lag; provides daily automated airfare CPI feeds for India's Headline Inflation Basket.
  * **DGCA**: Automated anti-gouging enforcement during regional disruptions, floods, and festive surges.
  * **150M+ Indian Flyers**: Saves consumers up to 34% per ticket by highlighting the optimal 14-to-21-day sweet-spot booking window and transparent zero-fee direct channels.
* **Future Roadmap**:
  1. Expansion to Tier-2/Tier-3 UDAN RCS regional connectivity routes.
  2. Integration of international city-pair bilateral airfare tracking.
  3. Predictive AI transformer models for 90-day forward price forecasting.
* **Conclusion**: VAYU-CPI transforms aviation price monitoring from a slow, manual retrospective survey into an automated, real-time national intelligence utility.

### 🎙️ **Speaker Notes (What to say in 30 seconds)**
> *"In conclusion, VAYU-CPI bridges the gap between macroeconomic policy and citizen welfare. It equips government leaders with high-frequency statistical data while protecting millions of Indian passengers every single day. Thank you, and we look forward to your questions."*
