<p align="center">
  <img src="Assets/Architecture.png" alt="CDSS Architecture" width="700" />
</p>

<h1 align="center">Clinical Decision Support System — AI Diagnostic Intelligence</h1>

<p align="center">
  <strong>Clinical Decision Support System: Chest X-Ray Meta-Ensemble Neural Network using Hybrid CNN–Transformer Architecture</strong><br/>
  Clinical Decision Support System with GradCAM++ Explainability and Dual-Tier RAG Reporting
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11-blue?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.133-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PyTorch-2.10+-EE4C2C?logo=pytorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Azure_AI-GPT--4o--mini-0078D4?logo=microsoftazure&logoColor=white" alt="Azure" />
  <img src="https://img.shields.io/badge/License-Research-yellow" alt="License" />
</p>

---

## 📌 Aim & Outcome

CDSS is an **AI-powered Clinical Decision Support System** that performs automated analysis of chest radiographs to detect and classify three thoracic conditions:

| Class | Description |
|-------|-------------|
| **Normal** | No significant pathology detected |
| **Pneumonia** | Pulmonary consolidation / lung opacity |
| **Pleural Effusion** | Fluid accumulation in the pleural space |

### What It Does

1. **Automated Radiograph Analysis** — A production-grade meta-ensemble of three state-of-the-art deep learning architectures classifies chest X-rays with high confidence in under 60 seconds.
2. **GradCAM++ Explainability** — Visual attention heatmaps show exactly *where* the AI focused during diagnosis, enabling clinical transparency.
3. **Dual-Tier RAG Reporting** — An Azure OpenAI (GPT-4o-mini) agent generates two distinct clinical narratives:
   - **Tier 2 — Radiologist Report**: Formal medical findings using standard clinical terminology, suitable for patient charts.
   - **Tier 1 — Patient Narrative**: An empathetic, plain-language explanation to improve patient health literacy.
4. **Context-Aware AI Assistant** — A chatbot that understands the scan results, heatmap localization, and patient metadata to answer follow-up clinical questions with safety guardrails.

---

## 🎯 Target Users & Clinical Impact

### For Radiologists
- **Reduced Turnaround Time** — Instant AI-assisted preliminary reads, freeing radiologists to focus on complex cases.
- **GradCAM++ Heatmaps** — Transparent attention maps that highlight regions of interest, enabling radiologists to validate AI findings and catch subtle pathologies.
- **Structured Tier 2 Reports** — Auto-generated formal reports with CURB-65 assessment recommendations for pneumonia cases.

### For Patients
- **Health Literacy** — Tier 1 patient narratives translate complex medical findings into accessible, empathetic language.
- **Interactive AI Guidance** — A chatbot that answers questions about the diagnosis in patient-friendly terms with built-in safety guardrails (emergency detection, prescription refusal).

### For Healthcare Facilities
- **High-Volume Screening** — Enables rapid triage of chest X-rays in resource-constrained settings.
- **Edge-Cloud Architecture** — Can run locally on-premises (CPU-only) or scale via cloud deployment.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | Component-based UI framework |
| **Vite 8** | Lightning-fast build tool & HMR dev server |
| **Tailwind CSS 4** | Utility-first styling with dark/light theme support |
| **@tailwindcss/typography** | Prose formatting for AI-generated markdown (reports & chat) |
| **Framer Motion** | Page transitions & micro-animations |
| **jsPDF** | Client-side PDF report generation |
| **Web Speech API** | Speech-to-text (mic input) & text-to-speech (voice output) |
| **Lucide React** | Premium icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | High-performance async API framework |
| **Uvicorn** | ASGI production server |
| **PyTorch 2.10+** | Deep learning inference engine |
| **timm** | Pre-trained model zoo (DenseNet, ConvNeXt, MaxViT) |
| **pytorch-grad-cam** | GradCAM++ heatmap generation |
| **matplotlib** | Heatmap colorbar rendering with intensity scale |
| **scikit-learn (joblib)** | Meta-learner serialization |
| **Pillow + SciPy** | Image processing & validation gates |
| **Pandas** | Ground truth dataset management |

### Cloud / AI
| Technology | Purpose |
|-----------|---------|
| **Azure AI Foundry** | Managed LLM endpoint hosting |
| **Azure OpenAI (Cognitive Services)** | GPT-4o-mini deployment for report generation & chat |
| **Azure AI Search** | RAG grounding for evidence-based report generation |

---

## 📁 Codebase Structure

```
Clinical-Decision-Support-System/
│
├── api.py                        # FastAPI backend — all endpoints & ML inference
├── startup.py                    # Azure Blob Storage download script (models + dataset)
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Backend Docker image definition
├── .dockerignore                 # Docker build exclusions
├── .gitignore                    # Git exclusions (secrets, Models/, Dataset/)
├── .env.example                  # Environment variable template
│
├── .github/
│   └── workflows/
│       └── azure-deploy.yml      # CI/CD: auto build + deploy on push to main
│
├── Models/                       # ⚠️ NOT in Git — stored in Azure Blob Storage
│   ├── densenet121/
│   │   └── best_tta.pth          # DenseNet-121 checkpoint (~108 MB)
│   ├── convnext_v2_base/
│   │   └── best_tta.pth          # ConvNeXtV2-Base checkpoint (~1.3 GB)
│   ├── maxvit_base/
│   │   └── best_tta.pth          # MaxViT-Base checkpoint (~1.4 GB)
│   └── meta_learner_logistic.pkl # L2 Logistic Meta-Learner
│
├── Dataset/                      # ⚠️ NOT in Git — stored in Azure Blob Storage
│   ├── data.csv                  # Ground truth labels (path → label mapping)
│   └── images/                   # Chest X-ray images (~20,805 PNG/JPG)
│
├── Assets/
│   ├── Architecture.png              # System architecture diagram
│   ├── Model Training Colab Notebook.pdf  # Model training notebook
│   ├── Knowledge Base.pdf            # Clinical knowledge reference
│   └── Research Paper.pdf            # Accompanying research paper
│
└── frontend/
    ├── index.html                # SEO-optimized entry point
    ├── .env.example              # Frontend env var template
    ├── package.json              # Node.js dependencies
    ├── vite.config.js            # Vite dev server + build config (port 8501, chunk splitting)
    ├── tailwind.config.js        # Tailwind CSS theme & animations
    ├── postcss.config.js         # PostCSS plugins (Tailwind + Autoprefixer)
    ├── eslint.config.js          # ESLint flat config for React 19
    ├── public/
    │   ├── favicon.svg           # SVG favicon
    │   ├── favicon.png           # PNG favicon (Apple Touch Icon)
    │   └── social-preview.png    # Open Graph / Twitter Card image (1200×630)
    └── src/
        ├── main.jsx              # React 19 root with ErrorBoundary
        ├── App.jsx               # Full application (~3,035 lines)
        └── index.css             # Design system & animations (~2,060 lines)
```

---

## 🧠 Model Architecture & Training

### The "Platinum Trio" Meta-Ensemble

CDSS employs a **stacking ensemble** of three diverse architectures, each bringing complementary inductive biases:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Input: 512×512 Chest X-Ray                  │
│                (ImageNet Normalized, Bicubic Resize)             │
└─────────────────┬──────────────────┬──────────────────┬─────────┘
                  │                  │                  │
          ┌───────▼───────┐  ┌──────▼───────┐  ┌──────▼──────┐
          │  DenseNet-121  │  │ ConvNeXtV2   │  │   MaxViT    │
          │   (108 MB)     │  │   Base       │  │    Base     │
          │                │  │  (1.3 GB)    │  │  (1.4 GB)   │
          │  Dense blocks  │  │  FCMAE pre-  │  │  Multi-axis │
          │  + feature     │  │  trained on  │  │  attention  │
          │  reuse         │  │  IN-22k      │  │  + conv     │
          └──────┬────────┘  └─────┬────────┘  └─────┬───────┘
                 │ [3 probs]       │ [3 probs]       │ [3 probs]
                 └────────┬────────┴────────┬────────┘
                          │  Concatenate     │
                          │  [9-dim vector]  │
                          ▼
                 ┌────────────────────┐
                 │  L2 Logistic       │
                 │  Meta-Learner      │
                 │  (Calibrated       │
                 │   Stacking)        │
                 └────────┬───────────┘
                          │
                  Final Prediction
                  + Confidence Score
```

| Model | Architecture | Params | Pre-training | Strength |
|-------|-------------|--------|-------------|----------|
| **DenseNet-121** | Dense connectivity with feature reuse | ~8M | ImageNet-1k | Efficient feature extraction, low memory |
| **ConvNeXtV2-Base** | Modernized ConvNet with FCMAE | ~89M | ImageNet-22k → 1k | Strong spatial priors from large-scale pre-training |
| **MaxViT-Base** | Multi-axis Vision Transformer | ~120M | ImageNet-1k | Global self-attention + local window attention |

### Training Details
- **Input Resolution**: 512×512 pixels
- **Augmentation**: Test-Time Augmentation (TTA) applied during validation
- **Ensemble Strategy**: L2-regularized Logistic Regression Meta-Learner trained on held-out TTA probabilities
- **GradCAM++ Extraction**: Applied to DenseNet-121's final feature layer to generate visual attention heatmaps with a vertical **intensity colorbar** (0.0–1.0 scale, jet colormap) rendered via matplotlib
- **Normal Case Explainability**: An expandable UI panel explains why the AI generates heatmaps even for Normal diagnoses (AI attention verification, uncertainty detection, audit trail)

### Image Validation Pipeline (6 Gates)
Before inference, every uploaded image passes through a multi-gate validation system:

| Gate | Check | Threshold | Rejects |
|------|-------|-----------|---------|
| 1 | Color channel deviation | > 15.0 | Color photographs, selfies |
| 2 | HSV saturation ratio | > 8% | Colorful non-medical images |
| 3 | Intensity std deviation | < 15.0 | Blank / flat images |
| 4 | Sobel edge density | < 2% or > 60% | Text documents, smooth photos |
| 5 | Edge orientation analysis | H/V ratio > 75% | Screenshots, typed text documents |
| 6 | Histogram bin concentration | Top-2 bins > 70% | Single-tone images, scanned docs |

---

## 📊 Performance Metrics

> Evaluated on the **held-out 20% TTA test set** (4,161 samples: 1,200 Normal · 1,561 Pneumonia · 1,400 Pleural Effusion).

### Meta-Ensemble (L2 Logistic Stacking) — Overall

| Metric | Value |
|--------|:-----:|
| **Overall Accuracy** | **89.33%** |
| **Macro-Avg Sensitivity** | **89.53%** |
| **Macro-Avg Specificity** | **94.70%** |
| **Macro-Avg F1 Score** | **89.28%** |
| **Micro-Avg AUC-ROC** | **0.9702** |

### Per-Class Breakdown

| Class | Sensitivity | Specificity | F1 Score | AUC-ROC |
|-------|:----------:|:----------:|:--------:|:-------:|
| **Normal** | 90.25% | 93.92% | 87.94% | 0.9680 |
| **Pneumonia** | 85.14% | 95.69% | 88.54% | 0.9554 |
| **Pleural Effusion** | 93.21% | 94.49% | 91.35% | 0.9763 |

### Inference Performance
| Metric | Target | Status |
|--------|--------|--------|
| End-to-end inference (CPU) | < 60 seconds | ✅ Achieved |
| Image validation | < 1 second | ✅ Achieved |
| Report generation (GPT-4o-mini) | < 10 seconds | ✅ Achieved |

---

## 🚀 Local Run Instructions

### Prerequisites

| Requirement | Minimum Version | Download |
|-------------|:-:|----------|
| **Python** | 3.11+ | [python.org/downloads](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Bundled with Node.js |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rakesh-vajrapu/Clinical-Decision-Support-System.git
cd Clinical-Decision-Support-System
```

> **💡 Tip:** The `Models/` (~2.8 GB) and `Dataset/` (~20K images) folders are **NOT** in Git — they're stored in Azure Blob Storage and downloaded automatically when the backend first starts. No Git LFS is needed.

---

### Step 2 — Create a Python Virtual Environment

```bash
# Create an isolated Python environment (avoids polluting your global packages)
python -m venv .venv
```

Activate it (**choose your OS/shell**):

```bash
# ── Windows (PowerShell) ──
.venv\Scripts\Activate.ps1

# ── Windows (Command Prompt) ──
.venv\Scripts\activate

# ── macOS / Linux ──
source .venv/bin/activate
```

You should see `(.venv)` appear in your terminal prompt — this confirms the virtual environment is active.

> **⚠️ PowerShell Users:** If you see a "running scripts is disabled" error, run this once:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> This allows PowerShell to execute the activation script. It's a one-time setting.

---

### Step 3 — Install Backend Dependencies

```bash
pip install -r requirements.txt
```

This installs **~30 packages** including PyTorch (~2 GB download), FastAPI, timm, grad-cam, and Azure SDKs. The first install may take 5–10 minutes depending on your internet speed.

> **💡 Tip:** If `pip install` fails on PyTorch, try upgrading pip first:
> ```bash
> pip install --upgrade pip setuptools wheel
> ```

---

### Step 4 — Configure Environment Variables

Copy the example file and fill in your Azure credentials:

```bash
# ── macOS / Linux ──
cp .env.example .env

# ── Windows (PowerShell) ──
Copy-Item .env.example .env
```

Then edit `.env` and add your credentials:

```env
# Azure AI Foundry — used for report generation & chatbot
FOUNDRY_API_KEY=your_azure_api_key_here
FOUNDRY_ENDPOINT=https://your-resource-hub.services.ai.azure.com/api/projects/your-project

# Azure OpenAI Cognitive Services — the LLM endpoint
AZURE_OPENAI_ENDPOINT=https://your-resource-hub.cognitiveservices.azure.com
AZURE_OPENAI_DEPLOYMENT=cdss-gpt-4o-mini-model

# CORS — comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:8501,http://127.0.0.1:8501

# Azure AI Search — enables RAG-grounded clinical reports (optional)
SEARCH_ENDPOINT=https://your-search-service.search.windows.net
SEARCH_API_KEY=your_search_api_key_here
SEARCH_INDEX_NAME=cdss-index

# Azure Blob Storage — downloads model checkpoints & dataset on first boot
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_BLOB_CONTAINER_NAME=cdss-assets
```

> **💡 What works without Azure keys?**
> - ✅ Image upload, validation, 3-model inference, GradCAM++ heatmaps — **work fully offline** once models are downloaded
> - ❌ Report generation, chatbot — require `FOUNDRY_*` and `AZURE_OPENAI_*` keys
> - ❌ Model download on first boot — requires `AZURE_STORAGE_CONNECTION_STRING`

---

### Step 5 — Start the Backend Server

```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

| Flag | What it does |
|------|-------------|
| `api:app` | Loads the `app` FastAPI instance from `api.py` |
| `--host 0.0.0.0` | Listens on all network interfaces (required for Docker / remote access) |
| `--port 8000` | Serves the API on port 8000 |

**What happens on startup:**
1. `startup.py` downloads model checkpoints (~2.8 GB) from Azure Blob Storage (skipped if files already exist)
2. Models load in a **background thread** — the server starts accepting HTTP requests immediately
3. Wait for `[STARTUP] All models ready` in the terminal (~60s first time, ~5s after caching)

> **⏳ Important:** The frontend will show a "Models Loading" banner until all 3 models are ready. You can upload images, but inference won't work until loading completes.

---

### Step 6 — Frontend Setup (New Terminal)

Open a **second terminal window** (keep the backend running in the first one):

```bash
cd frontend
npm install --legacy-peer-deps
```

| Flag | What it does |
|------|-------------|
| `--legacy-peer-deps` | Resolves ESLint peer dependency conflicts between React 19 and some plugins |

> **💡 Tip:** If `npm install` fails without `--legacy-peer-deps`, it's because `eslint-plugin-react` hasn't updated its peer dependency range for ESLint 10. The `--legacy-peer-deps` flag safely skips this check.

Create a `.env` file inside the `frontend/` folder:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

This tells the frontend where to find the backend API. If you deploy the backend elsewhere, change this URL accordingly.

---

### Step 7 — Start the Frontend Dev Server

```bash
npm run dev
```

This starts the **Vite 8** development server with Hot Module Replacement (HMR) — any code changes you make to the frontend will instantly reflect in the browser without a full page reload.

---

### Step 8 — Open in Browser

Navigate to **http://localhost:8501**

The CDSS interface will appear. Once the model loading banner disappears:
1. Click **"Deploy Random Validation"** to load a random X-ray from the dataset
2. Click **"Execute Diagnostic AI"** to run the 3-model ensemble inference
3. View the diagnosis, confidence score, GradCAM++ heatmap, and probability distribution
4. Generate **Radiologist** or **Patient** reports via the Reports panel
5. Chat with the **AI Assistant** for follow-up medical questions

---

### 🎯 Quick-Start Summary

```bash
# 1. Clone
git clone https://github.com/rakesh-vajrapu/Clinical-Decision-Support-System.git
cd Clinical-Decision-Support-System

# 2. Backend setup
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env              # Then edit .env with your Azure keys

# 3. Start backend (Terminal 1)
uvicorn api:app --host 0.0.0.0 --port 8000

# 4. Frontend setup (Terminal 2)
cd frontend
npm install --legacy-peer-deps
echo VITE_API_BASE_URL=http://127.0.0.1:8000 > .env

# 5. Start frontend
npm run dev

# 6. Open http://localhost:8501
```

---

## ☁️ Cloud Deployment Architecture

CDSS uses a split deployment model for cost-efficiency and performance:

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | [Vercel](https://vercel.com) | Auto-deploys from GitHub, React + Vite build |
| **Backend** | [Azure App Service](https://azure.microsoft.com/services/app-service/) | Docker container (Python 3.11-slim) with B3 plan (4 vCPU, 7 GB RAM) |
| **Models & Dataset** | [Azure Blob Storage](https://azure.microsoft.com/services/storage/blobs/) | ~2.8 GB model checkpoints + ~20K X-ray images in `cdss-assets` container |
| **AI Services** | Azure OpenAI (GPT-4o-mini) + Azure AI Search | Dual-tier RAG report generation and AI chatbot |

> **No Git LFS required.** Large files (Models/ and Dataset/) are stored in Azure Blob Storage and downloaded automatically at container startup via `startup.py`.

### Live URLs
| Service | URL |
|---------|-----|
| Frontend (Vercel) | [https://cxr-cdss.vercel.app](https://cxr-cdss.vercel.app) |
| Backend (Azure) | `https://cdss-backend.azurewebsites.net` |

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for fully automated deployment. Every push to `main` triggers:

```
push to main → Checkout → Docker Build (tagged with commit SHA) → Push to ACR → Deploy to Azure App Service
```

**Workflow file:** [`.github/workflows/azure-deploy.yml`](.github/workflows/azure-deploy.yml)

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `ACR_USERNAME` | Azure Container Registry admin username |
| `ACR_PASSWORD` | Azure Container Registry admin password |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure Portal → App Service → "Download publish profile" |

### Docker Image
- **Base:** `python:3.11-slim`
- **Registry:** `cdssregistryrakesh.azurecr.io/cdss-backend`
- **Tag strategy:** Commit SHA (`${{ github.sha }}`) — prevents Azure from caching stale images
- **Startup flow:** `startup.py` (downloads assets from Blob) → `uvicorn api:app --host 0.0.0.0 --port 8000`

---

## 📦 Azure Blob Storage Setup

The `Models/` (~2.8 GB) and `Dataset/` (~20K images) folders are stored in Azure Blob Storage to avoid Git LFS costs.

| Storage Account | Container | Contents |
|----------------|-----------|----------|
| `cdssstoragehub` | `cdss-assets` | 4 model files + `data.csv` + ~20,805 X-ray images |

### Blob Path Structure
```
cdss-assets/
├── Models/
│   ├── densenet121/best_tta.pth
│   ├── convnext_v2_base/best_tta.pth
│   ├── maxvit_base/best_tta.pth
│   └── meta_learner_logistic.pkl
└── Dataset/
    ├── data.csv
    └── images/   (20,805 files)
```

### Required Environment Variable
```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_BLOB_CONTAINER_NAME=cdss-assets
```

---

### 🔧 Troubleshooting

| Issue | Solution |
|-------|---------|
| **`pip install` fails on PyTorch** | Ensure Python 3.11+. Try `pip install --upgrade pip setuptools wheel` first |
| **PowerShell blocks `.ps1` activation** | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| **Backend starts but inference returns 503** | Models are still loading (~60s on local, ~3-5 min on first Azure boot). Wait for `[STARTUP] All models ready` in logs |
| **CORS errors in browser console** | Ensure `ALLOWED_ORIGINS` in `.env` includes your frontend URL (e.g., `https://cxr-cdss.vercel.app`) |
| **`libxcb.so.1` import error in Docker** | Ensure `opencv-python-headless` is in `requirements.txt` (not `opencv-python`) |
| **Azure App Service shows old image** | Images are tagged with commit SHA to prevent caching. Check ACR for latest tag |

---

## 🛠️ Performance & Scalability Features

### 1. Smart CPU Thread Allocation
The backend dynamically allocates **75% of available CPU cores** for PyTorch inference, leaving headroom for the browser, IDE, and OS to avoid freezing.

### 2. Persistent HTTP Client & Connection Pooling
All Azure OpenAI API calls (chat + report generation) use a **shared `httpx.AsyncClient`** with keepalive connection pooling, eliminating per-request TCP/TLS handshake overhead (~200–500ms savings per call).

### 3. Pre-Compiled Regex & Module-Level Imports
- **Medical term capitalization patterns** (18 regex) are pre-compiled at module load, avoiding recompilation on every chat response.
- All heavy imports (`scipy.ndimage`, `matplotlib`, `pytorch-grad-cam`) are loaded once at startup instead of on every function call.

### 4. Inference Pipeline Constants
- **`transforms.Compose`** (ImageNet normalization pipeline) and **`Image.Resampling.BICUBIC`** are resolved once at module level — not reconstructed per inference call.

### 5. Cached Dataset File Listing
The `/random_image` endpoint caches the 20,805-file directory listing on first call, eliminating repeated `os.listdir()` scans on every request.

### 6. Strict AI Medical Scope Restriction
The CDSS Assistant relies on Azure OpenAI's GPT-4o-mini but features a hardcoded **Scope Restriction Guardrail**:
- The AI is instructed to *strictly* refuse answering questions unrelated to chest X-rays, clinical diagnoses, respiratory conditions, or the CDSS application itself.
- Off-topic queries (e.g., about general tech companies, politics, or coding) trigger a polite, guiding refusal, ensuring the assistant remains a dedicated clinical tool.

---

## ⚠️ Medical Disclaimer

> This system is a **research prototype** and is **NOT** a certified medical device. It is intended to **assist** — not replace — qualified healthcare professionals. All AI-generated diagnoses, reports, and chatbot responses must be reviewed, validated, and confirmed by a licensed radiologist or physician before any clinical decision is made. **Do not use this system for self-diagnosis or treatment.**

---

<p align="center">
  Built with ❤️ by the CDSS Research Team
</p>
