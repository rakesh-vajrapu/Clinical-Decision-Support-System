# ─── CDSS Backend Docker Image ───
# Optimized for Azure App Service (Linux, CPU-only)

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by Pillow, scipy, matplotlib, and OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libjpeg-dev zlib1g-dev libffi-dev \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cached layer — only re-runs if requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY api.py .
COPY startup.py .
COPY .env.example .

# Create directories for blob-downloaded assets
RUN mkdir -p Models/densenet121 Models/convnext_v2_base Models/maxvit_base Dataset/images

# Expose the API port
EXPOSE 8000

# Start: download assets from Blob Storage, then launch Uvicorn
CMD ["sh", "-c", "python startup.py && uvicorn api:app --host 0.0.0.0 --port 8000"]
