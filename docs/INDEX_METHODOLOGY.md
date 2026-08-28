# Econometric Index Methodology: VAYU-CPI (APIx Prototype)

**Disclaimer**: VAYU-CPI is a prototype real-time Airfare Price Index designed to augment Consumer Price Index (CPI) analysis for MoSPI. It implements internationally recognized price index methodologies (Jevons Elementary Index & Laspeyres/Young Aggregation) aligned with DGCA domestic aviation passenger volume shares.

---

## 1. Mathematical Formulas

### Step 1: Micro-Level Elementary Aggregation (Jevons Geometric Mean)

For each route $r$ and advance booking horizon $h \in \{1, 7, 15, 30, 45\}$ on day $t$:

$$I_{r, h}^t = \frac{\left( \prod_{i=1}^{n_{r,h}} P_{r, h, i}^t \right)^{1/n_{r,h}}}{P_{r, h}^0} \times 100$$

Where:
- $P_{r, h, i}^t$ is the $i$-th clean observed total fare for route $r$ and horizon $h$ at time $t$.
- $n_{r, h}$ is the number of valid observed flight quotes in the sample.
- $P_{r, h}^0$ is the geometric mean baseline fare in the base period (Base Year 2024).

### Step 2: Horizon-Blended Route Micro-Index

For each route $r$:

$$I_r^t = \frac{\sum_{h} \alpha_h \cdot I_{r, h}^t}{\sum_{h} \alpha_h}$$

Where $\alpha_h$ represents the empirical purchase volume weights:
- $\alpha_1 = 0.15$ (T+1 Spot / Immediate)
- $\alpha_7 = 0.25$ (T+7 1-Week Advance)
- $\alpha_{15} = 0.25$ (T+15 Fortnight Advance)
- $\alpha_{30} = 0.20$ (T+30 1-Month Advance)
- $\alpha_{45} = 0.15$ (T+45 45-Day Advance)

### Step 3: National Composite Airfare Index (Laspeyres / Young Aggregate)

$$I_{\text{national}}^t = \frac{\sum_{r \in R_{\text{observed}}} w_r \cdot I_r^t}{\sum_{r \in R_{\text{observed}}} w_r}$$

Where $w_r$ is the DGCA domestic passenger traffic volume share for city-pair $r$.

---

## 2. Route Basket & Weight Normalization

Route weights are configured in `config/route_basket.json` derived from DGCA annual domestic city-pair passenger movement reports:

- **DEL-BOM / BOM-DEL**: 42% (Primary High-Density Business Trunk)
- **BLR-DEL / DEL-BLR**: 26% (IT & Capital Corridor)
- **DEL-CCU / CCU-DEL**: 14% (East Coast Trunk)
- **DEL-HYD / HYD-DEL**: 5%
- **DEL-MAA / MAA-DEL**: 4%
- **BOM-BLR / BLR-BOM**: 7%
- **DEL-PAT**: 1% (High Seasonal Demand)
- **BOM-GOI**: 1% (Leisure Corridor)

If a route is unobserved due to schedule suspensions, weights are dynamically normalized over the observed subset ($R_{\text{observed}}$) so that $\sum w_r = 1.0$.

---

## 3. Sub-Indices by Advance Booking Horizon

VAYU-CPI tracks 5 distinct sub-indices for monetary and regulatory policy:

1. **Spot Sub-Index ($I_{T+1}$)**: Immediate demand and supply shock sensitivity.
2. **Weekly Sub-Index ($I_{T+7}$)**: Standard consumer leisure and travel baseline.
3. **Fortnight Sub-Index ($I_{T+15}$)**: Medium-range booking trend.
4. **Advance Sub-Index ($I_{T+30}$)**: Planning horizon stability.
5. **Long Advance Sub-Index ($I_{T+45}$)**: Capacity release tariff baseline.
