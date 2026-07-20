"""Default, dependency-light embedder.

Fits a TF-IDF vocabulary over the exact pair of documents being compared for
this request, so it always works fully offline with no model download and no
external API call -- important for a tool that will often be handling
privileged legal or medical documents.
"""
from __future__ import annotations

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize


class TfidfEmbedder:
    def __init__(self) -> None:
        self._vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
        )

    def fit(self, corpus: list[str]) -> None:
        self._vectorizer.fit(corpus)

    def embed(self, texts: list[str]) -> np.ndarray:
        matrix = self._vectorizer.transform(texts)
        dense = matrix.toarray().astype(np.float32)
        # Rows for text with zero vocabulary overlap have zero norm; normalize
        # would otherwise divide by zero, so guard those explicitly.
        norms = np.linalg.norm(dense, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return dense / norms
