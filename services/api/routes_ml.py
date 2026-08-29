"""
services/api/routes_ml.py
Machine Learning inference and performance evaluation endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.schemas import MLPredictionRequest, MLPredictionResponse, MLModelMetricsResponse
from services.engine.ml.pipeline import ml_pipeline

router = APIRouter(prefix="/api/v1/ml", tags=["Machine Learning Pipeline"])


@router.get("/metrics", response_model=MLModelMetricsResponse)
def get_ml_metrics() -> MLModelMetricsResponse:
    """
    Returns out-of-sample ML model evaluation metrics (MAE, RMSE, MAPE, R2, Directional Accuracy)
    trained on chronological time-series splits with zero lookahead leakage.
    """
    return ml_pipeline.get_metrics()


@router.post("/predict", response_model=MLPredictionResponse)
def predict_airfare(payload: MLPredictionRequest) -> MLPredictionResponse:
    """
    Predicts forward airfare movement, expected % change, direction, recommendation, and top factors.
    """
    return ml_pipeline.predict(
        origin=payload.origin,
        destination=payload.destination,
        departure_date=payload.departure_date,
        booking_horizon=payload.booking_horizon,
        carrier=payload.carrier,
        current_fare=payload.current_fare,
    )


@router.post("/train", response_model=MLModelMetricsResponse)
def retrain_ml_model() -> MLModelMetricsResponse:
    """
    Triggers re-training of the ML pipeline on latest observations.
    """
    return ml_pipeline.train()
