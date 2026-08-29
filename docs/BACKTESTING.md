# Econometric Backtesting & Model Validation

The VAYU-CPI platform provides dual validation modes (`services/engine/backtester.py`) for evaluating aggregation pipeline stability and mathematical consistency:

1. **`mode="baseline_reference"` (Default)**: Validates computed VAYU-CPI index values against estimated 2024 domestic baseline reference tariffs.
2. **`mode="synthetic_self_check"`**: Mathematical self-consistency and numerical stability verification of the Jevons-Laspeyres aggregation formulas.

---

## 1. Important Regulatory Context on DGCA & Airfare Data

> **⚠️ TRANSPARENCY NOTICE ON GOVERNMENT DATA AVAILABILITY**
>
> In India, domestic airfares are **deregulated** under Rule 135 of the Aircraft Rules, 1937.
> Airlines are free to set tariffs based on market dynamics. While the DGCA maintains an internal
> **Tariff Monitoring Unit (TMU)** that randomly samples 78 domestic routes to check against declared
> upper limits, the Government of India **does not publish an open, continuous route-by-route or
> flight-by-flight fare database**.
>
> Consequently, the baseline reference dataset (`data/reference/estimated_reference_fares.csv`) is an
> **analyst-modeled baseline** constructed to provide a plausible base-period denominator ($P^0_{r,h}$)
> across 22 representative domestic corridors and 5 booking horizons ($T+1 \dots T+45$).
> It is **NOT** a verified government-published tariff table, and `is_simulation: true` is transparently declared.

---

## 2. Dual Validation Modes

### Mode A: `baseline_reference` (Default)
- **Reference Dataset**: `data/reference/estimated_reference_fares.csv`
- **Methodology**: Evaluates computed VAYU-CPI Laspeyres-Jevons composite index values over the observation period against the estimated baseline (Base 2024 = 100.0).
- **Simulation Flag**: `is_simulation = true`

#### What `baseline_reference` Mode Proves
✅ Validates that VAYU-CPI national composite index calculations remain numerically bounded and stable relative to base-period denominators.
✅ Confirms that weighting by DGCA city-pair domestic passenger traffic shares ($w_r$) behaves properly across all 22 tracked corridors.

#### What `baseline_reference` Mode Does NOT Prove
⚠️ Does NOT prove empirical accuracy against a government-verified historical fare table (as no such public table exists).
⚠️ Does NOT validate micro-level individual seat bucket yields.

---

### Mode B: `synthetic_self_check` (Internal Math Stability)
- **Methodology**: Evaluates mathematical self-consistency and numerical stability of elementary Jevons price relatives and Young-Laspeyres blending using deterministic test curves.
- **Simulation Flag**: `is_simulation = true`

---

## 3. Mathematical Error Metrics

### 1. Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{t=1}^{N} \left| I_{\text{VAYU}}^t - I_{\text{Ref}}^t \right|$$

### 2. Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^{N} \left( I_{\text{VAYU}}^t - I_{\text{Ref}}^t \right)^2}$$

### 3. Mean Absolute Percentage Error (MAPE)
$$\text{MAPE} = \frac{100}{N} \sum_{t=1}^{N} \left| \frac{I_{\text{VAYU}}^t - I_{\text{Ref}}^t}{I_{\text{Ref}}^t} \right|$$

### 4. Pearson Correlation Coefficient ($r$)
$$r = \frac{\sum (I_{\text{VAYU}}^t - \bar{I}_{\text{VAYU}})(I_{\text{Ref}}^t - \bar{I}_{\text{Ref}})}{\sqrt{\sum (I_{\text{VAYU}}^t - \bar{I}_{\text{VAYU}})^2 \sum (I_{\text{Ref}}^t - \bar{I}_{\text{Ref}})^2}}$$

---

## 4. Sample Validation Output (`mode=baseline_reference`)

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
    "reference_dataset": "Estimated 2024 Baseline Reference (Analyst Model — not official DGCA data)",
    "model_name": "VAYU-CPI Laspeyres-Jevons Hybrid Engine",
    "is_simulation": true,
    "validation_status": "PASSED"
  },
  "methodology_notes": "Validation of computed VAYU-CPI index against estimated 2024 baseline reference tariffs. ⚠️ TRANSPARENCY NOTE: Reference series is an analyst-modeled base period estimate (P^0_{r,h}), NOT an official published DGCA route-level table, as Indian aviation operates under deregulated market rules (Aircraft Rules 1937, Rule 135)."
}
```

---

## 5. API Endpoints

- `GET /backtest?mode=baseline_reference` (or `/api/v1/backtest`)
- `GET /methodology-validation?mode=synthetic_self_check`
