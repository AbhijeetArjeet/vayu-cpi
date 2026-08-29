"""
tests/test_upgrade.py
Validation suite for Week-wise Intelligence, Passenger Calendar/Score, and ML Model Pipeline.
"""

import unittest
from datetime import date, timedelta
from fastapi.testclient import TestClient

from services.api.main import app
from services.engine.weekly_engine import compute_weekly_airfare_intelligence, get_week_boundaries
from services.engine.ml.pipeline import ml_pipeline, calculate_corridor_distance_km
from services.engine.passenger_engine import (
    generate_fare_calendar,
    calculate_passenger_fare_score,
    generate_booking_recommendation,
)


class TestVayuProductUpgrade(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_week_boundaries(self):
        d = date(2026, 8, 26)  # Wednesday
        mon, sun = get_week_boundaries(d)
        self.assertEqual(mon.weekday(), 0)  # Monday
        self.assertEqual(sun.weekday(), 6)  # Sunday
        self.assertEqual((sun - mon).days, 6)

    def test_weekly_engine_calculation(self):
        res = compute_weekly_airfare_intelligence(mode="combined", num_weeks=6)
        self.assertIsNotNone(res)
        self.assertGreater(res.national_index, 50.0)
        self.assertGreater(len(res.routes), 0)
        self.assertGreater(len(res.carriers), 0)
        self.assertGreater(len(res.horizons), 0)
        self.assertEqual(len(res.historical_series), 6)
        self.assertIn(res.market_signal, ["STABLE", "RISING", "HIGH_PRESSURE"])

    def test_ml_pipeline_training_and_metrics(self):
        metrics = ml_pipeline.train()
        self.assertIsNotNone(metrics)
        self.assertTrue(metrics.is_trained)
        self.assertGreater(metrics.train_observations_count, 0)
        self.assertGreater(metrics.r2_score, 0.0)
        self.assertGreater(metrics.directional_accuracy_pct, 50.0)

    def test_ml_prediction_and_explainability(self):
        pred = ml_pipeline.predict(
            origin="DEL",
            destination="BOM",
            departure_date=(date.today() + timedelta(days=14)).isoformat(),
            booking_horizon=14,
            current_fare=5800.0,
        )
        self.assertIsNotNone(pred)
        self.assertGreater(pred.predicted_fare, 1000.0)
        self.assertIn(pred.prediction_direction, ["UP", "STABLE", "DOWN"])
        self.assertIn(pred.recommendation, ["BOOK", "WAIT", "SWITCH_DATE"])
        self.assertGreater(len(pred.top_factors), 0)
        self.assertGreater(pred.confidence, 0.5)

    def test_passenger_fare_calendar(self):
        cal = generate_fare_calendar("DEL", "BOM", year=2026, month=9)
        self.assertEqual(cal.origin, "DEL")
        self.assertEqual(cal.destination, "BOM")
        self.assertEqual(len(cal.days), 30)
        self.assertGreater(cal.peak_fare, cal.cheapest_fare)
        self.assertGreater(cal.max_savings, 0)
        for day in cal.days:
            self.assertIn(day.status, ["LOW", "NORMAL", "HIGH"])

    def test_passenger_fare_score(self):
        # Cheap fare
        score_cheap = calculate_passenger_fare_score("DEL", "BOM", current_fare=3200.0, horizon_days=15)
        self.assertLessEqual(score_cheap.fare_score, 50)
        self.assertIn(score_cheap.rating, ["Very Cheap", "Cheap"])

        # Expensive Tatkal fare
        score_high = calculate_passenger_fare_score("DEL", "BOM", current_fare=9800.0, horizon_days=1)
        self.assertGreater(score_high.fare_score, 65)

    def test_passenger_booking_recommendation(self):
        rec = generate_booking_recommendation(
            origin="DEL",
            destination="BOM",
            departure_date=(date.today() + timedelta(days=2)).isoformat(),
            current_fare=8200.0,
            horizon_days=2,
        )
        self.assertEqual(rec.recommendation, "BOOK NOW")
        self.assertGreater(len(rec.top_factors), 0)

    def test_api_weekly_endpoint(self):
        res = self.client.get("/api/v1/index/weekly?mode=combined&num_weeks=4")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("national_index", data)
        self.assertIn("wow_change_pct", data)
        self.assertIn("historical_series", data)

    def test_api_ml_endpoints(self):
        metrics_res = self.client.get("/api/v1/ml/metrics")
        self.assertEqual(metrics_res.status_code, 200)
        m_data = metrics_res.json()
        self.assertIn("mae", m_data)
        self.assertIn("directional_accuracy_pct", m_data)

        predict_res = self.client.post("/api/v1/ml/predict", json={
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": "2026-09-15",
            "booking_horizon": 15,
            "current_fare": 5400.0,
        })
        self.assertEqual(predict_res.status_code, 200)
        p_data = predict_res.json()
        self.assertIn("predicted_fare", p_data)
        self.assertIn("top_factors", p_data)

    def test_api_passenger_endpoints(self):
        cal_res = self.client.get("/api/v1/passenger/calendar?origin=DEL&destination=BOM&year=2026&month=9")
        self.assertEqual(cal_res.status_code, 200)
        self.assertEqual(len(cal_res.json()["days"]), 30)

        score_res = self.client.post("/api/v1/passenger/fare-score", json={
            "origin": "DEL",
            "destination": "BOM",
            "current_fare": 4900.0,
            "horizon_days": 7
        })
        self.assertEqual(score_res.status_code, 200)
        self.assertIn("fare_score", score_res.json())

        rec_res = self.client.post("/api/v1/passenger/recommendation", json={
            "origin": "DEL",
            "destination": "BOM",
            "departure_date": "2026-09-15",
            "current_fare": 4900.0,
            "horizon_days": 15
        })
        self.assertEqual(rec_res.status_code, 200)
        self.assertIn("recommendation", rec_res.json())


if __name__ == "__main__":
    unittest.main()
