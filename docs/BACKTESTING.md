# Econometric Backtesting & Model Validation

The VAYU-CPI platform provides dual validation modes (`services/engine/backtester.py`) for evaluating index calculation accuracy and mathematical consistency:

1. **`mode="real_dgca"` (Default)**: Empirical validation against authentic DGCA / Ministry of Civil Aviation domestic tariff baseline benchmarks.
2. **`mode="synthetic_self_check"`**: Mathematical self-consistency and numerical stability verification of the Jevons-Laspeyres aggregation formulas.

---

## 1. Dual Validation Modes

### Mode A: `real_dgca` (Empirical Regulatory Benchmark)
- **Source Reference**: `data/reference/dgca_domestic_fares_reference.csv`
- **Citation**: Directorate General of Civil Aviation (DGCA) Tariff Monitoring Unit & Ministry of Civil Aviation Parliamentary Tariff Returns (Base 2024–2025).
- **Data Attributes**: Official average benchmark economy fares ($P^0_{r,h}$) across 22 representative domestic corridors and 5 booking horizons ($T+1, T+7, T+15, T+30, T+45$).
- **Methodology**: Compares actual computed VAYU-CPI Laspeyres-Jevons composite index values over the observation period against the official regulatory baseline (Base 2024 = 100.0).
- **Simulation Flag**: `is_simulation = false`

#### What `real_dgca` Mode Proves
✅ Validates that VAYU-CPI national composite index trajectories remain aligned with official regulatory benchmark levels.
✅ Confirms that weighting by DGCA city-pair domestic passenger traffic shares ($w_r$) behaves properly across all 22 tracked corridors.

#### What `real_dgca` Mode Does NOT Prove
⚠️ Does NOT compare against continuous, real-time intraday airline inventory feeds (since DGCA does not publish live real-time API feeds under deregulated market conditions).
⚠️ Does NOT validate micro-level individual seat bucket yields.

---

### Mode B: `synthetic_self_check` (Internal Math Stability)
- **Methodology**: Evaluates mathematical self-consistency and numerical stability of elementary Jevons price relatives and Young-Laspeyres blending.
- **Reference**: Deterministic benchmark curve for regression testing.
- **Simulation Flag**: `is_simulation = true`

---

## 2. Mathematical Error Metrics

### 1. Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} \left| I_{\text{VAYU}}^t - I_{\text{Ref}}^t \right|$$

### 2. Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} \left( I_{\text{VAYU}}^t - I_{\text{Ref}}^t \right)^2}$$

### 3. Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \frac{100}{N} \sum_{t=1}^{N} \left| \frac{I_{\text{VAYU}}^t - I_{\text{Ref}}^t}{I_{\text{Ref}}^t} \right|$$

### 4. Pearson Correlation Coefficient ($r$)
$$r = \frac{\sum (I_{\text{VAYU}}^t - \bar{I}_{\text{VAYU}})(I_{\text{Ref}}^t - \bar{I}_{\text{Ref}})}{\sqrt{\sum (I_{\text{VAYU}}^t - \bar{I}_{\text{VAYU}})^2 \sum (I_{\text{Ref}}^t - \bar{I}_{\text{Ref}})^2}}$$

---

## 3. Sample Validation Output (`mode=real_dgca`)

```json
{
  "metrics": {
    "period_start": "2026-07-31",
    "period_end": "2026-08-29",
    "observation_days": 30,
    "mae": 1.85,
    "rmse": 2.14,
    "mape": 1.78,
    "pearson_correlation": 1.0,
    "reference_dataset": "DGCA Tariff Monitoring Unit & MoCA Domestic Returns (2024-2025)",
    "model_name": "VAYU-CPI Laspeyres-Jevons Hybrid Engine",
    "is_simulation": false,
    "validation_status": "PASSED"
  },
  "methodology_notes": "Empirical validation against DGCA & MoCA Domestic Tariff Returns (Base 2024 = 100). Evaluates real computed VAYU-CPI composite index values against official regulatory baseline tariffs across domestic city-pair corridors."
}
```

---

## 4. API Endpoints

- `GET /backtest?mode=real_dgca` (or `/api/v1/backtest?mode=real_dgca`)
- `GET /methodology-validation?mode=synthetic_self_check`
