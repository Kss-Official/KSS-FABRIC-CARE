import os
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
from google.auth.credentials import AnonymousCredentials
from app.core.config import settings

_app: Optional[firebase_admin.App] = None
_db = None
_bucket = None


class EmulatorCredential(credentials.Base):
    def get_credential(self):
        return AnonymousCredentials()


def init_firebase() -> firebase_admin.App:
    global _app, _db, _bucket

    if _app is not None:
        return _app

    if settings.USE_EMULATOR:
        os.environ["FIRESTORE_EMULATOR_HOST"] = settings.FIRESTORE_EMULATOR_HOST
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = settings.FIREBASE_AUTH_EMULATOR_HOST
        os.environ["FIREBASE_STORAGE_EMULATOR_HOST"] = settings.FIREBASE_STORAGE_EMULATOR_HOST
        os.environ["GCLOUD_PROJECT"] = settings.FIREBASE_PROJECT_ID

    options = {
        "projectId": settings.FIREBASE_PROJECT_ID,
        "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
    }

    if (
        not settings.USE_EMULATOR
        and settings.GOOGLE_APPLICATION_CREDENTIALS
        and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS)
    ):
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
    elif settings.USE_EMULATOR:
        cred = EmulatorCredential()
    else:
        cred = credentials.ApplicationDefault()

    if not firebase_admin._apps:
        _app = firebase_admin.initialize_app(cred, options)
    else:
        _app = firebase_admin.get_app()

    return _app


def get_db():
    global _db
    if _db is None:
        init_firebase()
        _db = firestore.client()
    return _db


def get_auth():
    init_firebase()
    return auth


def get_bucket():
    global _bucket
    if _bucket is None:
        init_firebase()
        try:
            _bucket = storage.bucket(settings.FIREBASE_STORAGE_BUCKET)
        except Exception:
            _bucket = None
    return _bucket
