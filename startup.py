"""
Azure Blob Storage Download Script
───────────────────────────────────
Downloads Models/ and Dataset/ from Azure Blob Storage on first boot.
Skips files that already exist locally (idempotent).

Required env var:
    AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=..."
    AZURE_BLOB_CONTAINER_NAME      = "cdss-assets"   (defaults to "cdss-assets" if not set)
"""

import os
import time

# ─── Files to download (blob_path → local_path) ───
BLOB_FILES = [
    # Model checkpoints
    ("Models/densenet121/best_tta.pth", "Models/densenet121/best_tta.pth"),
    ("Models/convnext_v2_base/best_tta.pth", "Models/convnext_v2_base/best_tta.pth"),
    ("Models/maxvit_base/best_tta.pth", "Models/maxvit_base/best_tta.pth"),
    ("Models/meta_learner_logistic.pkl", "Models/meta_learner_logistic.pkl"),
    # Dataset ground truth
    ("Dataset/data.csv", "Dataset/data.csv"),
]

# Dataset images are downloaded as a batch (entire virtual directory)
BLOB_IMAGE_PREFIX = "Dataset/images/"
LOCAL_IMAGE_DIR = "Dataset/images/"


def download_blob_assets():
    """Download model checkpoints and dataset from Azure Blob Storage."""
    connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    if not connection_string:
        print("[BLOB] AZURE_STORAGE_CONNECTION_STRING not set — skipping blob download (assuming local files exist).")
        return

    # Lazy import so the SDK isn't required for local development
    from azure.storage.blob import ContainerClient

    container_name = os.getenv("AZURE_BLOB_CONTAINER_NAME", "cdss-assets")
    container_client = ContainerClient.from_connection_string(connection_string, container_name)

    t0 = time.time()
    downloaded = 0

    # ── Download individual files (models + data.csv) ──
    for blob_path, local_path in BLOB_FILES:
        if os.path.exists(local_path):
            print(f"[BLOB] SKIP (exists): {local_path}")
            continue

        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        print(f"[BLOB] Downloading: {blob_path} → {local_path} ...")

        blob_client = container_client.get_blob_client(blob_path)
        with open(local_path, "wb") as f:
            stream = blob_client.download_blob()
            stream.readinto(f)

        size_mb = os.path.getsize(local_path) / (1024 * 1024)
        print(f"[BLOB] Downloaded: {local_path} ({size_mb:.1f} MB)")
        downloaded += 1

    # ── Download dataset images (batch) ──
    os.makedirs(LOCAL_IMAGE_DIR, exist_ok=True)
    existing_images = set(os.listdir(LOCAL_IMAGE_DIR)) if os.path.exists(LOCAL_IMAGE_DIR) else set()

    if existing_images:
        print(f"[BLOB] Dataset images directory already has {len(existing_images)} files — skipping image download.")
    else:
        print(f"[BLOB] Downloading dataset images from '{BLOB_IMAGE_PREFIX}' ...")
        image_count = 0
        for blob in container_client.list_blobs(name_starts_with=BLOB_IMAGE_PREFIX):
            filename = blob.name.replace(BLOB_IMAGE_PREFIX, "")
            if not filename:
                continue
            local_file = os.path.join(LOCAL_IMAGE_DIR, filename)

            blob_client = container_client.get_blob_client(blob.name)
            with open(local_file, "wb") as f:
                stream = blob_client.download_blob()
                stream.readinto(f)
            image_count += 1

            if image_count % 1000 == 0:
                print(f"[BLOB]   ... {image_count} images downloaded so far")

        print(f"[BLOB] Downloaded {image_count} dataset images.")
        downloaded += image_count

    elapsed = round(time.time() - t0, 1)
    print(f"[BLOB] Asset sync complete — {downloaded} files downloaded in {elapsed}s.")


if __name__ == "__main__":
    download_blob_assets()
