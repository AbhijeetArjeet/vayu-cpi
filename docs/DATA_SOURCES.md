# Official Data Sources & Provenance Registry

VAYU-CPI maintains strict provenance tracking across all data inputs.

---

## 1. Official Data Sources

### MoSPI e-Sankhyiki Portal
- **URL**: https://esankhyiki.mospi.gov.in/
- **Role in Project**: Primary macroeconomic benchmark and CPI transport commodity basket reference.
- **Usage**: Reference weights for transport sub-group indexing and base-year comparison standards.

### Directorate General of Civil Aviation (DGCA)
- **URL**: https://www.dgca.gov.in/
- **Role in Project**: Official Domestic City-Pair Passenger Traffic Statistics and Airline Market Share Statistics.
- **Usage**: Used to establish representative route basket weights ($w_r$), airline concentration benchmarks, and baseline tariffs.

---

## 2. Market Ingestion Sources

### Google Flights Production Feed
- **Connector**: `OTAConnector` / `GoogleFlightsConnector`
- **Role**: Continuous live observation of multi-carrier fare offers across domestic routes.

### Amadeus GDS (Enterprise Adapter)
- **Connector**: `AmadeusConnector`
- **Role**: Itemized GDS fare queries with base fare and tax breakdowns where enterprise credentials are provided.

---

## 3. Data Classification Standard

Every observation in the VAYU-CPI database is explicitly categorized:

1. **`DGCA_REFERENCE`**: Historical benchmark tariffs from DGCA reports.
2. **`LIVE_FLIGHT`**: Real-time market observations collected via ethical web connectors.
3. **`SIMULATED`**: Transparently labeled synthetic datasets used for offline testing, calibration, and backtesting validation.
4. **`DERIVED`**: Unbundled fee decompositions or econometric index aggregations.
