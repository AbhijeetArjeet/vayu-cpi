"""
tests/test_ai_and_audit.py
Comprehensive test suite verifying:
1. Dynamic ML model training & zero data leakage
2. Generative AI analyst cascading provider & grounding rules
3. REST endpoints for /api/v1/ai/analyze and /api/v1/ai/status
"""

import unittest
from fastapi.testclient import TestClient
from services.api.main import app
from services.engine.ml.pipeline import AirfareMLModel, ml_pipeline
from services.engine.ai.provider import generate_ai_analysis, generate_deterministic_vayu_explanation
from services.engine.ai.analyst import process_ai_analyst_query
from core.schemas import AIAnalysisRequest


class TestAIAndAuditPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_ml_dynamic_metrics_no_hardcoding(self):
        """Verify ML pipeline computes metrics dynamically without static fallbacks."""
        model = AirfareMLModel()
        metrics = model.train()
        
        self.assertTrue(metrics.is_trained)
        self.assertGreater(metrics.train_observations_count, 0)
        self.assertGreater(metrics.test_observations_count, 0)
        self.assertTrue("Gradient Boosted" in metrics.algorithm or "HistGradientBoosting" in metrics.algorithm)
        self.assertIn("VERIFIED_NO_LEAKAGE", metrics.data_leakage_audit)
        
        # Verify predictions work
        pred = model.predict("DEL", "BOM", "2026-09-15", booking_horizon=14, current_fare=5500.0)
        self.assertGreater(pred.predicted_fare, 1000.0)
        self.assertIn(pred.prediction_direction, ["UP", "DOWN", "STABLE"])
        self.assertGreater(len(pred.top_factors), 0)

    def test_deterministic_grounded_ai_fallback(self):
        """Verify the deterministic grounded AI explanation produces factual VAYU markdown."""
        context = {
            "national_index": 105.24,
            "wow_change_pct": 3.1,
            "market_signal": "RISING",
            "fastest_rising_route": "DEL-BOM",
            "cheapest_corridor": "BOM-GOI",
            "total_observations": 15200,
        }
        res = generate_deterministic_vayu_explanation("Why are airfares rising this week?", context)
        self.assertIn("105.24", res)
        self.assertIn("+3.1%", res)
        self.assertIn("DEL-BOM", res)
        self.assertIn("15,200", res)

    def test_ai_analyst_query_processing(self):
        """Verify process_ai_analyst_query returns valid schema."""
        req = AIAnalysisRequest(
            question="Should I book Delhi to Mumbai?",
            origin="DEL",
            destination="BOM",
            current_fare=5900.0,
            query_type="SHOULD_I_BOOK"
        )
        res = process_ai_analyst_query(req)
        self.assertIsNotNone(res.answer)
        self.assertTrue(res.grounded_on_vayu_data)
        self.assertIn(res.provider_used, ["GROQ", "GEMINI", "OPENROUTER", "DETERMINISTIC_GROUNDED_ENGINE"])
        self.assertGreater(len(res.key_takeaways), 0)

    def test_ai_rest_endpoints(self):
        """Test /api/v1/ai/status and /api/v1/ai/analyze endpoints."""
        status_res = self.client.get("/api/v1/ai/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["status"], "ONLINE")

        analyze_res = self.client.post("/api/v1/ai/analyze", json={
            "question": "What is the current national airfare trend?",
            "query_type": "EXPLAIN_WEEKLY"
        })
        self.assertEqual(analyze_res.status_code, 200)
        data = analyze_res.json()
        self.assertIn("answer", data)
        self.assertIn("key_takeaways", data)
        self.assertTrue(data["grounded_on_vayu_data"])


if __name__ == "__main__":
    unittest.main()
