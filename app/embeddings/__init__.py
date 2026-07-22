"""Embedder factory: picks a backend based on configuration, falling back to
the offline TF-IDF embedder if a requested optional backend isn't installed.
"""
from __future__ import annotations

import logging

from app.config import settings
from app.embeddings.base import Embedder
from app.embeddings.tfidf import TfidfEmbedder

logger = logging.getLogger(__name__)


def get_embedder() -> Embedder:
    if settings.embedding_backend == "sentence-transformers":
        try:
            from app.embeddings.sentence_transformer import SentenceTransformerEmbedder

            return SentenceTransformerEmbedder(settings.sentence_transformer_model)
        except ImportError:
            logger.warning(
                "HIV_EMBEDDING_BACKEND=sentence-transformers but the "
                "sentence-transformers package isn't installed; falling back "
                "to the TF-IDF embedder."
            )
    return TfidfEmbedder()
