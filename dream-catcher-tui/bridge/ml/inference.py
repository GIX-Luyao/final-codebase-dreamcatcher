#!/usr/bin/env python3
"""
Self-contained ML inference module for intent classification.

Designed to be portable: copy this file + model.joblib + feature_columns.json
into any project and call IntentClassifier.from_directory() to start classifying
NFStream flow objects.

Dependencies: joblib, numpy (+ scikit-learn installed for joblib to deserialize).
"""

import json
import math
import warnings
from pathlib import Path

import joblib
import numpy as np


# Derived features that must be computed from raw flow attributes
_DERIVED_FEATURES = {
    "packets_ratio": lambda f: _safe_div(f["src2dst_packets"], f["bidirectional_packets"]),
    "bytes_ratio": lambda f: _safe_div(f["src2dst_bytes"], f["bidirectional_bytes"]),
    "bytes_per_packet": lambda f: _safe_div(f["bidirectional_bytes"], f["bidirectional_packets"]),
}


def _safe_div(a, b):
    """Division that returns 0.0 on zero denominator or non-finite result."""
    if b == 0:
        return 0.0
    result = a / b
    if not math.isfinite(result):
        return 0.0
    return result


class IntentClassifier:
    """Lightweight wrapper around a trained sklearn model for flow classification."""

    def __init__(self, model, feature_columns: list[str]):
        self.model = model
        self.feature_columns = feature_columns

    @classmethod
    def from_directory(cls, model_dir: str | Path) -> "IntentClassifier":
        """Load model and feature columns from a directory.

        Expects:
            model_dir/model.joblib
            model_dir/feature_columns.json
        """
        model_dir = Path(model_dir)
        model = joblib.load(model_dir / "model.joblib")
        with open(model_dir / "feature_columns.json") as f:
            feature_columns = json.load(f)
        return cls(model, feature_columns)

    def extract_features(self, flow) -> np.ndarray:
        """Extract feature vector from an NFStream flow object.

        Handles both direct NFStream attributes and derived features.
        Returns a 1D numpy array in the order expected by the model.
        """
        values = []
        for col in self.feature_columns:
            if col in _DERIVED_FEATURES:
                # Derived feature: compute from raw attributes
                raw = {
                    "src2dst_packets": getattr(flow, "src2dst_packets", 0),
                    "bidirectional_packets": getattr(flow, "bidirectional_packets", 0),
                    "src2dst_bytes": getattr(flow, "src2dst_bytes", 0),
                    "bidirectional_bytes": getattr(flow, "bidirectional_bytes", 0),
                }
                values.append(_DERIVED_FEATURES[col](raw))
            else:
                values.append(getattr(flow, col, 0))

        x = np.array(values, dtype=np.float64)
        x = np.nan_to_num(x, nan=0.0, posinf=0.0, neginf=0.0)
        return x

    def classify(self, flow) -> tuple[str, float]:
        """Classify a single NFStream flow.

        Returns:
            (intent, confidence) where intent is one of the 5 intent categories
            and confidence is the predicted probability for that class.
        """
        x = self.extract_features(flow).reshape(1, -1)
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message="sklearn.utils.parallel.delayed",
                category=UserWarning,
            )
            intent = self.model.predict(x)[0]
            proba = self.model.predict_proba(x)[0]
        confidence = float(proba.max())
        return intent, confidence
