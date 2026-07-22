"""Embedder interface shared by every backend.

`fit` is optional (corpus-fitted backends like TF-IDF implement it; fixed
pretrained-model backends can skip it) -- callers check `hasattr(embedder,
"fit")` before calling it.
"""
from __future__ import annotations

from typing import Protocol

import numpy as np


class Embedder(Protocol):
    def embed(self, texts: list[str]) -> np.ndarray:
        """Return an (n, d) matrix of L2-normalized embeddings, one row per text."""
        ...
