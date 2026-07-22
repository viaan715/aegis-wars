"""Optional higher-recall embedder backed by a local sentence-transformers model.

Not installed by default (it pulls in torch and a model download), but a
production deployment that wants better paraphrase recall than TF-IDF can
switch to it by installing `sentence-transformers` and setting
`HIV_EMBEDDING_BACKEND=sentence-transformers`.
"""
from __future__ import annotations

import numpy as np


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> np.ndarray:
        embeddings = self._model.encode(texts, normalize_embeddings=True)
        return np.asarray(embeddings, dtype=np.float32)
