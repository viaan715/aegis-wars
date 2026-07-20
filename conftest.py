"""Ensures tests run against an isolated, throwaway SQLite database and a
known admin key -- must be set before any `app.*` module is imported,
since `app.config.Settings` reads these env vars once at class definition
time.
"""
import os
import tempfile

_tmp_db = tempfile.NamedTemporaryFile(prefix="hiv_test_", suffix=".db", delete=False)
_tmp_db.close()

os.environ["HIV_DB_PATH"] = _tmp_db.name
os.environ["HIV_ADMIN_KEY"] = "test-admin-key"
