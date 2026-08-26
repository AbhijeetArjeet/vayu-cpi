import statistics
from datetime import datetime, timedelta
from typing import List
from core.schemas import SurgeAlert

def detect_surges(fare_records, rolling_window_days=30) -> List[SurgeAlert]:
    corridors = {}
    for r in fare_records:
        corr = f"{r.origin}-{r.destination}"
        if corr not in corridors:
            corridors[corr] = []
        corridors[corr].append(r)
        
    alerts = []
    now = datetime.now()
    now_str = now.isoformat()
    
    for corr, records in corridors.items():
        if not records:
            continue
            
        def parse_date(d):
            if isinstance(d, str):
                return datetime.fromisoformat(d)
            return d
            
        latest = max((parse_date(r.scraped_at) for r in records))
        current_cutoff = latest - timedelta(days=1)
        
        current_prices = [r.total_fare for r in records if parse_date(r.scraped_at) > current_cutoff]
        baseline_prices = [r.total_fare for r in records if parse_date(r.scraped_at) <= current_cutoff]
        
        if not current_prices or len(baseline_prices) < 5:
            continue
            
        current_avg = sum(current_prices) / len(current_prices)
        baseline_avg = sum(baseline_prices) / len(baseline_prices)
        baseline_std = statistics.pstdev(baseline_prices)
        
        if baseline_std == 0:
            continue
            
        sigma = (current_avg - baseline_avg) / baseline_std
        
        if sigma >= 3.0:
            severity = "MODERATE"
            if sigma >= 4.0:
                severity = "CRITICAL"
            elif sigma >= 3.5:
                severity = "HIGH"
                
            origin, destination = corr.split('-')
            
            carrier_counts = {}
            for r in records:
                if parse_date(r.scraped_at) > current_cutoff:
                    carrier_name = getattr(r, 'carrier_name', getattr(r, 'carrier_code', 'Unknown'))
                    carrier_counts[carrier_name] = carrier_counts.get(carrier_name, 0) + 1
            if carrier_counts:
                dominant_carrier = max(carrier_counts.items(), key=lambda x: x[1])[0]
                pct = int((max(carrier_counts.values()) / len(current_prices)) * 100)
                dominance = f"{dominant_carrier} {pct}%"
            else:
                dominance = "Unknown"
                
            alerts.append(SurgeAlert(
                corridor=corr,
                origin=origin,
                destination=destination,
                current_fare=round(current_avg, 2),
                baseline_30d_fare=round(baseline_avg, 2),
                sigma_deviation=round(sigma, 2),
                severity=severity,
                carrier_dominance=dominance,
                flagged_at=now_str
            ))
            
    return alerts
