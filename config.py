import os
import secrets
from datetime import timedelta


def _load_or_create_secret() -> str:
    env_secret = os.getenv("SECRET_KEY", "").strip()
    if env_secret and env_secret != "REPLACE_WITH_SECURE_HEX_SECRET":
        return env_secret
    data_dir = os.path.abspath(os.path.join(os.getcwd(), "data"))
    os.makedirs(data_dir, exist_ok=True)
    secret_file = os.path.join(data_dir, ".flask_secret")
    if os.path.exists(secret_file):
        with open(secret_file, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    generated = secrets.token_hex(32)
    with open(secret_file, "w", encoding="utf-8") as fh:
        fh.write(generated)
    os.chmod(secret_file, 0o600)
    return generated


class Config:
    SECRET_KEY = _load_or_create_secret()
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///../data/aaknova_flask.db",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }
    SESSION_COOKIE_NAME = "aaknova_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    PERMANENT_SESSION_LIFETIME = timedelta(days=14)
    BACKUP_DIR = os.getenv("BACKUP_DIR", os.path.abspath(os.path.join(os.getcwd(), "data", "backups")))
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024
