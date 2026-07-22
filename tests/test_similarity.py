import math

from app.biometrics import face, voice


def test_cosine_similarity_identical_vectors_is_one():
    v = [1.0, 2.0, 3.0]
    assert math.isclose(face.cosine_similarity(v, v), 1.0, rel_tol=1e-9)


def test_cosine_similarity_orthogonal_vectors_is_zero():
    assert math.isclose(face.cosine_similarity([1, 0], [0, 1]), 0.0, abs_tol=1e-9)


def test_cosine_similarity_opposite_vectors_is_negative_one():
    assert math.isclose(face.cosine_similarity([1, 0], [-1, 0]), -1.0, rel_tol=1e-9)


def test_cosine_similarity_zero_vector_is_defined_as_zero():
    assert face.cosine_similarity([0, 0, 0], [1, 2, 3]) == 0.0


def test_best_match_against_references_picks_the_closest():
    embedding = [1.0, 0.0]
    references = [[0.0, 1.0], [1.0, 0.01], [-1.0, 0.0]]
    best = face.best_match_against_references(embedding, references)
    assert math.isclose(best, face.cosine_similarity(embedding, [1.0, 0.01]), rel_tol=1e-6)


def test_best_match_against_no_references_is_zero():
    assert face.best_match_against_references([1.0, 0.0], []) == 0.0


def test_voice_best_match_reuses_face_cosine_similarity():
    embedding = [0.5, 0.5]
    references = [[0.5, 0.5]]
    assert math.isclose(voice.best_match_against_references(embedding, references), 1.0, rel_tol=1e-6)
