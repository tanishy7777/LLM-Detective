# 🔍 LLM Detective

> **An advanced AI-powered document analysis system for detecting AI-generated content with precision and style**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-green.svg)

LLM Detective is a cutting-edge document analysis platform that combines advanced OCR technology with machine learning to identify AI-generated content in PDF documents. Built with modern web technologies, it offers real-time processing, intelligent classification, and stunning visual analytics through an intuitive glassmorphic interface.

## ✨ Key Features

### 🚀 **Core Capabilities**
- **🔄 Real-time PDF OCR Processing**: WebSocket-based text extraction with live progress tracking
- **🤖 AI Content Detection**: ML-powered classification into 5 categories (AI, Human, Humanised, Polished, Undetermined)
- **🎨 Interactive Web Interface**: Modern React dashboard with glassmorphic design and cosmic aesthetics
- **📊 Visual Analytics**: Color-coded text highlighting with percentage breakdowns and interactive tooltips
- **⏹️ Process Control**: Start/stop OCR analysis with real-time progress monitoring
- **📄 Smart Pagination**: Efficient page-by-page results with jump-to-page functionality

### 🛠️ **Advanced Features**
- **📈 OpenTelemetry Integration**: Comprehensive distributed tracing for monitoring and debugging
- **🔒 Firebase Authentication**: Secure IITGN email-based login system
- **📱 Responsive Design**: Optimized for desktop and mobile devices
- **🎯 File Management**: Drag-and-drop PDF upload with progress tracking
- **⚡ Performance Optimized**: Efficient chunk processing and memory management

## 🏗️ Architecture & Tech Stack

### 🔧 **Backend Technologies**
- **FastAPI** - High-performance async web framework with automatic API documentation
- **PyMuPDF (fitz)** - Advanced PDF processing and manipulation
- **Tesseract OCR** - Industry-standard optical character recognition
- **OpenTelemetry** - Distributed tracing and observability platform
- **WebSockets** - Real-time bidirectional communication
- **pdf2image** - PDF to image conversion with Pillow integration
- **httpx** - Modern async HTTP client for ML model requests
- **Firebase Admin SDK** - Authentication and user management

### ⚛️ **Frontend Technologies**
- **React 19** - Latest React with concurrent features and hooks
- **TypeScript** - Type-safe JavaScript development with enhanced IDE support
- **Material-UI v7** - Modern React component library with custom theming
- **Redux Toolkit** - Predictable state management with RTK Query
- **Vite** - Lightning-fast build tool and development server
- **Framer Motion** - Smooth animations and micro-interactions
- **Chart.js** - Beautiful data visualization and analytics
- **Tailwind CSS** - Utility-first CSS framework for rapid styling

### 🧠 **Machine Learning Stack**
- **PyTorch** - Deep learning framework for model inference
- **Safetensors** - Secure and fast tensor serialization
- **Custom BERT-based Model** - Fine-tuned transformer for AI content detection
- **Tokenization Pipeline** - Advanced text preprocessing and chunking

## 📁 Project Architecture

```
LLM-Detective/.
├── backend
│   ├── Auth
│   │   ├── Config.py
│   │   ├── JWT.py
│   │   └── Route.py
│   ├── credentials.json
│   ├── Database
│   │   ├── Credentials.py
│   │   ├── Document.py
│   │   ├── Helper.py
│   │   ├── Models.py
│   │   ├── Project.py
│   │   └── User.py
│   ├── Main.py
│   ├── requirements.txt
│   ├── Routes
│   │   ├── CONFIG.py
│   │   └── ProjectManager.py
│   ├── Run.sh
│   ├── Socket
│   │   └── Upload.py
│   ├── Static
│   ├── Templates
│   │   ├── Fin-PDF-High.html
│   │   ├── OCR-Test.html
│   │   ├── PDF-Highlight.html
│   │   └── PDF-OCR.html
│   ├── Tesseract
│   │   └── OCR.py
│   ├── Test
│   │   ├── Data
│   │   │   ├── S4_underlined.pdf
│   │   │   ├── XMLtesthighlighted.pdf
│   │   │   ├── XMLtest.pdf
│   │   │   └── XMLtest.xml
│   │   ├── PDFConversion.py
│   │   └── XMLConversion.py
│   ├── uploads
│   │   ├── aa5b7df0-2afb-49d4-b921-b1aca8418fc5
│   │   │   ├── results
│   │   │   └── uploads
│   │   │       └── Hello1
│   │   │           ├── S1.pdf
│   │   │           ├── S2.pdf
│   │   │           ├── S3.pdf
│   │   │           └── S4.pdf
│   │   └── Test
│   └── Utils
│       ├── CONFIG.py
│       ├── File.py
│       ├── Group.py
│       ├── Para.py
│       ├── PDF.py
│       ├── Request.py
│       └── Server.py
├── directory_structure.txt
├── docs
│   ├── Dashboard.png
│   ├── Inference.png
│   ├── Login.png
│   ├── log.png
│   ├── New Project.png
│   ├── OAUTH2.png
│   └── workflow.tex
├── frontend
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── public
│   │   └── vite.svg
│   ├── README.md
│   ├── src
│   │   ├── assets
│   │   │   ├── 404.svg
│   │   │   ├── AI.png
│   │   │   ├── Background.jpg
│   │   │   ├── Brain.jpg
│   │   │   ├── Brain.png
│   │   │   ├── IITGN-evening.jpg
│   │   │   ├── iitgn-logo.png
│   │   │   ├── Logo.png
│   │   │   ├── logo-white.png
│   │   │   ├── NoProject.svg
│   │   │   └── react.svg
│   │   ├── Components
│   │   │   ├── AddProject.tsx
│   │   │   ├── Advanced.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Quick.tsx
│   │   ├── Credentials
│   │   │   └── Secret.json
│   │   ├── index.css
│   │   ├── main.tsx
│   │   ├── Pages
│   │   │   ├── 404.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Home.tsx
│   │   │   └── Login.tsx
│   │   ├── Router.tsx
│   │   ├── Store
│   │   │   ├── Doc.ts
│   │   │   ├── Login.ts
│   │   │   ├── Projects.ts
│   │   │   └── User.ts
│   │   ├── Store.ts
│   │   ├── Urls.ts
│   │   └── Utils
│   │       ├── DataConversion.ts
│   │       ├── GoogleAuth.ts
│   │       └── TypeCast.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── LICENSE
├── model
│   ├── API.py
│   ├── BERT
│   │   ├── best_tinybert.pth
│   │   └── tinybert.py
│   ├── CONFIG.py
│   ├── Dataset
│   │   └── converted.json
│   ├── DistilBERT
│   │   ├── BERT.ipynb
│   │   └── BERT.py
│   ├── LogisticRegresion
│   │   ├── label_encoder_model.pkl
│   │   ├── label_encoder_type.pkl
│   │   ├── logistic_regression_model.pkl
│   │   └── tfidf_vectorizer.pkl
│   ├── LogisticRegression
│   ├── ml_algos final.ipynb
│   ├── requirements.txt
│   ├── RoBERTa
│   │   ├── assets
│   │   │   ├── data_generated_table.png
│   │   │   ├── Interface1.png
│   │   │   └── Interface2.png
│   │   ├── checkpoint.pt
│   │   ├── job_script.sh
│   │   ├── pipeline
│   │   │   ├── dataset.py
│   │   │   ├── jsonl_convert.ipynb
│   │   │   ├── main.py
│   │   │   ├── model_pipeline.py
│   │   │   ├── outputs
│   │   │   │   └── tokenized_FacebookAI
│   │   │   │       └── roberta-base
│   │   │   │           ├── dataset_dict.json
│   │   │   │           ├── train
│   │   │   │           │   ├── data-00000-of-00001.arrow
│   │   │   │           │   ├── dataset_info.json
│   │   │   │           │   └── state.json
│   │   │   │           └── val
│   │   │   │               ├── data-00000-of-00001.arrow
│   │   │   │               ├── dataset_info.json
│   │   │   │               └── state.json
│   │   │   └── results
│   │   ├── README.md
│   │   └── script
│   │       ├── llm-detectaive.py
│   │       ├── samples_converted.jsonl
│   │       ├── samples.json
│   │       └── samples.jsonl
│   ├── Templates
│   │   └── Test.html
│   └── TinyBERT
│       ├── config.json
│       ├── model.safetensors
│       └── TinyBERT.py
├── README.md
├── README.md.bak
└── scripts
    ├── datacreation_pipeline
    │   ├── llama-7b
    │   │   ├── run_humanized1.py
    │   │   ├── run_inference1.py
    │   │   └── run_llama31_job.sh
    │   ├── llama-7b_30k
    │   │   ├── run_inference2.py
    │   │   └── run_llama32_job.sh
    │   └── llama-7b_copy
    │       ├── run_humanized.py
    │       ├── run_inference3.py
    │       └── run_llama33_job.sh
    ├── GenerateFileTree.sh
    └── UpdateREADMeFileTree.sh

50 directories, 140 files

```

## � Quick Start Guide

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.8+ | Backend development |
| **Node.js** | 16+ | Frontend development |
| **npm/yarn** | Latest | Package management |
| **Tesseract OCR** | Latest | Text recognition |
| **Git** | Latest | Version control |
| **Docker** | Optional | Containerization |

### ⚡ One-Command Setup

```bash
# Clone and setup everything
git clone https://github.com/VivekRaj2708/LLM-Detective.git
cd LLM-Detective
chmod +x setup.sh && ./setup.sh
```

### 🔧 Manual Installation

#### 1️⃣ **Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install core dependencies
pip install -r requirements.txt

# Install additional packages
pip install pdf2image Pillow pdfminer.six PyMuPDF \
           opentelemetry-api opentelemetry-sdk \
           opentelemetry-instrumentation-fastapi \
           opentelemetry-exporter-otlp-proto-grpc

# Start the FastAPI server
python Main.py
```

✅ **Backend will be running at:** `http://localhost:5000`

#### 2️⃣ **Frontend Setup**

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ **Frontend will be running at:** `http://localhost:5173`

#### 3️⃣ **ML Model Server**

```bash
# Navigate to model directory
cd ../model

# Install model dependencies
pip install torch transformers

# Start model inference server
python API.py
```

✅ **Model API will be running at:** `http://localhost:3344`

### 🐳 Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Model API: http://localhost:3344
```

## � User Guide

### 🎯 **Getting Started**

1. **🚀 Launch Application**
   - Open your browser and navigate to `http://localhost:5173`
   - Sign in using your IITGN email credentials

2. **📄 Upload Document**
   - Drag and drop a PDF file or click to browse
   - Supported formats: PDF files up to 50MB
   - File name will be truncated for display (20 chars + extension)

3. **⚡ Start Analysis**
   - Click **"ACTIVATE ANALYSIS"** to begin OCR processing
   - Real-time progress bar shows processing status
   - Use **"STOP ANALYSIS"** button to halt processing anytime

4. **📊 View Results**
   - Results appear in real-time with color-coded highlighting
   - Navigate between pages using pagination controls
   - Jump to specific pages using the page input field

### 🎨 **Classification Legend**

| Color | Category | Description |
|-------|----------|-------------|
| 🔴 **Red** | AI-Generated | Content detected as AI-created |
| 🟠 **Orange** | Humanised | AI content edited by humans |
| 🟢 **Green** | Human-Written | Original human content |
| 🔵 **Blue** | Polished | Human content with minor AI assistance |
| 🟣 **Purple** | Undetermined | Cannot classify with confidence |

### 🔌 **API Reference**

#### **WebSocket Endpoints**

| Endpoint | Protocol | Purpose |
|----------|----------|---------|
| `/ws/ocr/pdf` | WebSocket | Real-time PDF OCR processing |
| `/ws/upload` | WebSocket | File upload with progress tracking |

#### **REST API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ocr` | Single image OCR processing |
| `POST` | `/api/ocr/pdf` | Batch PDF processing |
| `POST` | `/api/login` | User authentication |
| `GET` | `/OCR` | OCR test interface |
| `GET` | `/Run` | Health check endpoint |
| `GET` | `/` | Main web interface |

#### **WebSocket Message Format**

```json
{
  "page": 1,
  "chunk": 1,
  "text": "Sample text content",
  "data": {
    "input": "Sample text content",
    "result": 2
  }
}
```

## ⚙️ Configuration

### 🌍 **Environment Variables**

Create `.env` files in respective directories for configuration:

#### **Backend Configuration** (`backend/.env`)
```env
# Model API Settings
MODEL_API_URL=http://localhost:3344/api/get
MODEL_MAX_CHUNKS=150
MODEL_TIMEOUT=30

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=52428800  # 50MB
ALLOWED_EXTENSIONS=.pdf

# OCR Configuration
TESSERACT_PATH=/usr/bin/tesseract
TESSERACT_LANG=eng
OCR_DPI=300

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=llm-detective-backend
LOG_LEVEL=INFO

# Firebase Settings
FIREBASE_CREDENTIALS_PATH=credentials.json
FIREBASE_PROJECT_ID=your-project-id

# Security
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

#### **Frontend Configuration** (`frontend/.env`)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_BASE_URL=ws://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# UI Configuration
VITE_APP_TITLE=LLM Detective
VITE_MAX_UPLOAD_SIZE=50
VITE_SUPPORTED_FORMATS=pdf

# Development Settings
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
```

### 🔧 **System Dependencies**

#### **Tesseract OCR Installation**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-eng
sudo apt-get install libtesseract-dev libleptonica-dev

# CentOS/RHEL/Fedora
sudo dnf install tesseract tesseract-devel
# or
sudo yum install tesseract tesseract-devel

# macOS (Homebrew)
brew install tesseract

# macOS (MacPorts)
sudo port install tesseract

# Windows (Chocolatey)
choco install tesseract

# Windows (Manual)
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

#### **Additional System Libraries**

```bash
# For PDF processing
sudo apt-get install poppler-utils  # Ubuntu/Debian
brew install poppler               # macOS

# For image processing
sudo apt-get install libmagickwand-dev  # Ubuntu/Debian
brew install imagemagick              # macOS
```

### 🔥 **Firebase Setup**

1. **Create Firebase Project**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login and initialize
   firebase login
   firebase init
   ```

2. **Download Service Account Key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `backend/credentials.json`

3. **Configure Authentication**
   - Enable Google Sign-In in Firebase Authentication
   - Add your domain to authorized domains

## 📊 Monitoring & Observability

### 🔍 **OpenTelemetry Integration**

LLM Detective includes comprehensive observability with distributed tracing:

#### **Jaeger Tracing Setup**
```bash
# Start Jaeger with Docker
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Access Jaeger UI
open http://localhost:16686
```

#### **Available Traces**
- **PDF Processing Pipeline**: End-to-end document analysis
- **OCR Performance**: Text extraction timing and accuracy
- **ML Model Inference**: Classification request tracing
- **WebSocket Communication**: Real-time data flow
- **Error Tracking**: Comprehensive error logging

#### **Custom Metrics**
- Processing time per page
- Classification accuracy rates
- Memory usage patterns
- WebSocket connection health
- File upload success rates

### 📈 **Performance Monitoring**

```bash
# View system metrics
htop  # Process monitoring
iotop # I/O monitoring
nethogs # Network usage

# Application-specific monitoring
curl http://localhost:5000/health  # Backend health
curl http://localhost:3344/health  # Model health
```

## 🧪 Testing Suite

### 🔬 **Backend Testing**

```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run specific test modules
python -m unittest Test.XMLConversion -v

# Run with coverage
python -m pytest --cov=. tests/

# Performance testing
python -m pytest tests/performance/ -v
```

#### **Test Categories**
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint validation
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization

### ⚛️ **Frontend Testing**

```bash
cd frontend

# Install test dependencies (if not already installed)
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test Login.test.ts

# Watch mode for development
npm run test:watch
```

#### **Test Coverage**
- **Component Tests**: React component rendering and interaction
- **Redux Tests**: State management validation
- **Integration Tests**: API communication testing
- **E2E Tests**: Complete user workflow testing

### 🚀 **Performance Testing**

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost:5000/api/ocr

# WebSocket stress testing
wscat -c ws://localhost:5000/ws/ocr/pdf

# Frontend performance testing
npm run test:performance
```

## 🛠️ Development

### 🔄 **Development Workflow**

```bash
# Setup development environment
git clone https://github.com/VivekRaj2708/LLM-Detective.git
cd LLM-Detective

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... coding ...

# Run tests
npm run test        # Frontend tests
python -m pytest   # Backend tests

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### 📝 **Code Style Guidelines**

#### **Python (Backend)**
```bash
# Install development tools
pip install black isort flake8 mypy

# Format code
black .
isort .

# Lint code
flake8 .
mypy .
```

#### **TypeScript/React (Frontend)**
```bash
# Install development tools
npm install --save-dev prettier eslint

# Format code
npm run lint:fix
npm run format

# Type checking
npm run type-check
```

### 🔧 **Adding New Features**

1. **Backend API Endpoint**
   ```python
   # Add to Main.py
   @app.post("/api/new-feature")
   async def new_feature(request: Request):
       # Implementation
       pass
   ```

2. **Frontend Component**
   ```tsx
   // Add to Components/
   export default function NewFeature() {
       // Implementation
   }
   ```

3. **Tests**
   ```bash
   # Backend test
   python -m pytest tests/test_new_feature.py
   
   # Frontend test
   npm run test NewFeature.test.tsx
   ```

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### 📋 **Contribution Guidelines**

1. **🍴 Fork the Repository**
   ```bash
   git fork https://github.com/VivekRaj2708/LLM-Detective.git
   ```

2. **🔧 Setup Development Environment**
   ```bash
   cd LLM-Detective
   ./setup-dev.sh  # Run development setup script
   ```

3. **🌟 Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **✨ Make Your Changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

5. **🧪 Test Your Changes**
   ```bash
   npm run test:all  # Run all tests
   ```

6. **📝 Commit with Conventional Commits**
   ```bash
   git commit -m "feat: add amazing new feature"
   ```

7. **🚀 Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```

### 🏷️ **Commit Message Convention**

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Maintenance tasks

### 🐛 **Bug Reports**

Please include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, browser, versions
- **Screenshots**: If applicable

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### � **License Summary**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ Liability not accepted
- ❌ Warranty not provided

## 👥 Team & Contributors

### 🏛️ **Core Team**

- **[Vivek Raj](https://github.com/VivekRaj2005)** - *Full-Stack Developer & ML Integration*
  - 🎓 IIT Gandhinagar
  - 🔧 Front End, Backend Architecture, ML Integration
  - 📧 Contact: [vivek.raj@iitgn.ac.in]

- **[Tanish Yelgoe](https://github.com/tanishy7777)** - *DataCreation & Model Training*
  - 🎓 IIT Gandhinagar
  - 🔧 Created the data for LLM classification and 4-class Classification
  - 🔧 Trained the 4-class classification model 
  - 📧 Contact: [tanish.yelgoe@iitgn.ac.in]

- **[Praanshu Patel](https://github.com/Praanshu101)** - *DataCreation & Model Training*
  - 🎓 IIT Gandhinagar
  - 🔧 Created a subset of Mistral Machine Polished data
  - 🔧 Trained the LLM class prediction model (TinyBert and DistilBERT)
  - 📧 Contact: [praanshu.patel@iitgn.ac.in]
 
- **[Aeshaa Nehal Shah](https://github.com/Aeshaa482)** - *DataCreation & Model Training*
  - 🎓 IIT Gandhinagar
  - 🔧 Created a subset of Mistral Machine Generated data
  - 🔧 Trained the LLM source (two-class) prediction model (RoBERTa-base)
  - 📧 Contact: [aeshaa.shah@iitgn.ac.in]

- **[Sharvari Mirge](https://github.com/msharvari31)** - *DataCreation & Model Training*
  - 🎓 IIT Gandhinagar
  - 🔧 Created a subset of Machine Polished data
  - 🔧 Trained the LLM source (two-class) prediction model (RoBERTa-base)
  - 📧 Contact: [sharvari.mirge@iitgn.ac.in]

## 🙏 Acknowledgments

### 🏆 **Special Thanks**

- **[IIT Gandhinagar](https://iitgn.ac.in/)** - Institutional support and resources
- **[OpenTelemetry Community](https://opentelemetry.io/)** - Comprehensive observability framework
- **[Material-UI Team](https://mui.com/)** - Beautiful React component library
- **[FastAPI Creators](https://fastapi.tiangolo.com/)** - High-performance async web framework
- **[Tesseract OCR](https://github.com/tesseract-ocr/tesseract)** - Optical character recognition engine
- **[PyMuPDF Contributors](https://pymupdf.readthedocs.io/)** - PDF processing capabilities

### 🛠️ **Technologies & Libraries**

| Category | Technology | Purpose |
|----------|------------|---------|
| **Backend** | FastAPI, PyMuPDF, Tesseract | Core processing |
| **Frontend** | React 19, Material-UI, TypeScript | User interface |
| **ML/AI** | PyTorch, Transformers, Safetensors | Content detection |
| **DevOps** | OpenTelemetry, Docker, Firebase | Deployment & monitoring |
| **Testing** | Pytest, Vitest, Testing Library | Quality assurance |

### 🌟 **Community**

Join our growing community of developers and researchers working on AI content detection:

- 💬 **[GitHub Discussions](https://github.com/VivekRaj2708/LLM-Detective/discussions)** - General discussions
- 🐛 **[Issues](https://github.com/VivekRaj2708/LLM-Detective/issues)** - Bug reports and feature requests
- 📧 **[Mailing List](mailto:llm-detective@iitgn.ac.in)** - Project updates and announcements

---

<div align="center">

### 🔍 **LLM Detective**
*Detecting AI-generated content with precision and style*

[![Made with ❤️ at IIT Gandhinagar](https://img.shields.io/badge/Made%20with%20❤️%20at-IIT%20Gandhinagar-blue.svg)](https://iitgn.ac.in/)
[![Powered by AI](https://img.shields.io/badge/Powered%20by-AI-brightgreen.svg)](https://github.com/VivekRaj2708/LLM-Detective)

**[🏠 Home](https://github.com/VivekRaj2708/LLM-Detective) • [📖 Docs](https://github.com/VivekRaj2708/LLM-Detective/wiki) • [🚀 Demo](https://llm-detective.iitgn.ac.in) • [💬 Community](https://github.com/VivekRaj2708/LLM-Detective/discussions)**

</div>
