import os
import shutil
from pathlib import Path
from typing import BinaryIO
from app.config import settings

class BaseStorageDriver:
    def save(self, file_obj: BinaryIO, filename: str, subfolder: str = "") -> str:
        raise NotImplementedError
        
    def get_url(self, relative_path: str) -> str:
        raise NotImplementedError

class LocalStorageDriver(BaseStorageDriver):
    """Local disk storage driver for development and free-tier environments."""
    def __init__(self, base_dir: Path = settings.BASE_DIR):
        self.base_dir = base_dir

    def save(self, file_obj: BinaryIO, filename: str, subfolder: str = "uploads") -> str:
        target_dir = self.base_dir / subfolder
        target_dir.mkdir(parents=True, exist_ok=True)
        dest_path = target_dir / filename
        with open(dest_path, "wb") as f:
            shutil.copyfileobj(file_obj, f)
        return str(dest_path)

    def get_url(self, relative_path: str) -> str:
        return f"/{relative_path.replace(os.sep, '/')}"

class S3StorageDriver(BaseStorageDriver):
    """Production AWS S3 driver with presigned URL support and SSE-S3 encryption."""
    def __init__(self, bucket_name: str = None, region: str = "ap-southeast-2"):
        self.bucket = bucket_name or os.getenv("AWS_S3_BUCKET", "dermai-medical-assets")
        self.region = region
        self._s3_client = None

    @property
    def client(self):
        if self._s3_client is None:
            try:
                import boto3
                self._s3_client = boto3.client("s3", region_name=self.region)
            except Exception as e:
                print(f"[!] Warning: boto3 S3 client init error: {e}. Falling back to mock driver.")
                self._s3_client = None
        return self._s3_client

    def save(self, file_obj: BinaryIO, filename: str, subfolder: str = "uploads") -> str:
        s3_key = f"{subfolder}/{filename}"
        if self.client:
            self.client.upload_fileobj(
                file_obj, 
                self.bucket, 
                s3_key,
                ExtraArgs={"ServerSideEncryption": "AES256"}
            )
            return f"s3://{self.bucket}/{s3_key}"
        # Fallback if boto3 credentials not active
        return LocalStorageDriver().save(file_obj, filename, subfolder)

    def get_url(self, relative_path: str, expires_in: int = 3600) -> str:
        if self.client and relative_path.startswith("s3://"):
            s3_key = relative_path.replace(f"s3://{self.bucket}/", "")
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_key},
                ExpiresIn=expires_in
            )
        return f"/{relative_path.replace(os.sep, '/')}"

class StorageService:
    """Unified storage interface supporting seamless switching between Local and S3 backends."""
    _driver = None

    @classmethod
    def get_driver(cls) -> BaseStorageDriver:
        if cls._driver is None:
            backend = os.getenv("STORAGE_BACKEND", "local").lower()
            if backend == "s3":
                cls._driver = S3StorageDriver()
            else:
                cls._driver = LocalStorageDriver()
        return cls._driver
