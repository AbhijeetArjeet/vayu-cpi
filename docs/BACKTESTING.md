# 30-Day Econometric Backtesting & Model Validation

The VAYU-CPI platform includes an automated 30-day econometric backtesting module (`services/engine/backtester.py`) that evaluates the index calculation against benchmark tariff trajectories.

---

## 1. Backtesting Workflow

```text
30-Day Historical Observations
             ↓
Data Cleaning & Normalization
             ↓
VAYU-CPI Index Calculation (Jevons-Laspeyres Hybrid)
             ↓
Comparison with DGCA Reference Tariff Series
             ↓
Error Metrics Calculation (MAE, RMSE, MAPE, Pearson r)
             ↓
REST API (/backtest) & Dashboard Visualization
```

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

## 3. Sample Backtest Validation Output

```json
{
  "metrics": {
    "period_start": "2026-07-30",
    "period_end": "2026-08-28",
    "observation_days": 30,
    "mae": 1.12,
    "rmse": 1.48,
    "mape": 1.05,
    "pearson_correlation": 0.9842,
    "reference_dataset": "DGCA Domestic City-Pair Tariff Reference (2024-2025)",
    "model_name": "VAYU-CPI Laspeyres-Jevons Hybrid Engine",
    "is_simulation": true,
    "validation_status": "PASSED"
  }
}
```

*Note: Historical benchmark reference data is transparently classified as reference calibration data derived from DGCA statistical returns.*
