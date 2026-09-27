# 🎓 StudyLens AI — Video Knowledge Engine & Study Platform

StudyLens AI is a production-level AI learning SaaS that transforms educational videos and YouTube lectures into a **persistent, centralized Knowledge Base**. Instead of passively watching videos or running independent, duplicate LLM summarizations, StudyLens extracts structured concepts, definitions, relationships, and learning objectives into an intelligent layer that powers automated summaries, smart notes, interactive quizzes, flashcards, semantic chapter detection, exam revision packages, and an adaptive AI Tutor.

---

## 🌟 Key Architectural Highlights

- **Centralized Knowledge Base Architecture**: Single-pass extraction creates a unified semantic graph (learning objectives, hierarchical topics, core concepts with definitions, factual takeaways, concept relationships, and chapter boundaries) that all downstream study features consume.
- **Semantic Chunking**: Intelligent passage formation (150–350 words) respecting punctuation boundaries and speaker pause gaps, replacing disjointed raw Whisper segments.
- **Dual-Engine AI Intelligence**:
  - **Gemini 2.5 Flash**: High-speed, structured JSON schema generation for Knowledge Base extraction, AI Tutor Mode, and Exam Revision Mode.
  - **Ollama (Llama 3.1:8b)**: Fast, deterministic local generation for concise study summaries, notes, quizzes, and flashcards.
- **Fault-Tolerant Parallel Pipeline**: Non-blocking background workers run feature generation concurrently (`asyncio.gather`), with graceful per-feature fallbacks so a single feature failure never crashes the pipeline.
- **Dual Vector Indexing**: ChromaDB indexes both semantic chunks (for contextual concept retrieval) and granular Whisper segments (for exact-second timeline seeking).
- **Dark-First SaaS Aesthetic**: Glassmorphism, radiant glows, animated Framer Motion transitions, responsive design, and Lucide SVG icons.

---

## 🚀 Feature Matrix

| Feature | Description | Engine / Model | Status |
| :--- | :--- | :--- | :---: |
| **Video Ingestion** | Upload local video files or paste any YouTube URL | FastAPI / yt-dlp / FFmpeg | ✅ |
| **High-Speed Transcription** | VAD-filtered int8 quantized CPU speech-to-text | faster-whisper | ✅ |
| **Semantic Chunking** | Cohesive passage grouping (150–350 words) with pause analysis | Custom Chunking Engine | ✅ |
| **Knowledge Base Extraction** | Single-pass structured graph (topics, concepts, definitions, facts, relations) | Gemini 2.5 Flash (Ollama fallback) | ✅ |
| **Vector Search Indexing** | Semantic chunk embeddings & cross-session metadata | SentenceTransformers / ChromaDB | ✅ |
| **AI Summary** | Clean executive summaries with read-time estimates & key takeaways | Knowledge Base → Ollama | ✅ |
| **Smart Study Notes** | Scannable, topic-grouped bulleted study notes | Knowledge Base → Ollama | ✅ |
| **Interactive Quiz** | 4-option MCQs with score tracking, answer reveals, and reset | Knowledge Base → Ollama | ✅ |
| **Active Recall Flashcards** | 3D flip card animations, progress tracking, and session review | Knowledge Base → Ollama | ✅ |
| **Chapter Detection** | Semantic topic boundaries with one-click timeline seek | Knowledge Base Extraction | ✅ |
| **Interactive Transcript** | Timestamped full transcript with semantic concept search | Whisper / ChromaDB | ✅ |
| **Ask AI (Lecture Q&A)** | RAG-grounded questions with direct timestamp citations | ChromaDB / Ollama | ✅ |
| **Cross-Lecture Synthesis** | Ask questions across all processed lectures in your library | ChromaDB Multi-Session RAG | ✅ |
| **AI Tutor Mode** | Adaptive tutor with analogies, examples, and practice questions | ChromaDB / Gemini 2.5 Flash | ✅ |
| **Exam Revision Mode** | 8-section exam cram sheet (cheat sheet, memory tricks, pitfalls) | Gemini 2.5 Flash | ✅ |
| **Persistent Sessions** | Real-time session state, resume mid-process, and user isolation | PostgreSQL (Neon) / Prisma | ✅ |
| **Secure Authentication** | Access/refresh JWT tokens, HttpOnly cookies, bcrypt hashing | Next.js Server Actions / JOSE | ✅ |

---

## 📊 Knowledge Base Processing Pipeline

```text
                  Video Upload / YouTube Link
                              │
                              ▼
                      Background Worker
                              │
                     [EXTRACTING_AUDIO]
                      FFmpeg Audio Strip
                              │
                              ▼
                       [TRANSCRIBING]
                 faster-whisper (int8 + VAD)
                              │
                              ▼
                      Semantic Chunking
                   (Cohesive 150-350w Blocks)
                              │
                              ▼
                 [BUILDING_KNOWLEDGE_BASE]
                  Single Intelligence Pass
                  (Gemini 2.5 Flash / Schema)
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  Knowledge Base Graph                     Vector Indexing
  • Topics & Subtopics               [GENERATING_EMBEDDINGS]
  • Concepts & Definitions             ChromaDB Store Chunks
  • Key Factual Takeaways              & Precise Segments
  • Concept Relationships                         │
  • Learning Objectives                           │
  • Chapter Boundaries                            │
          │                                       │
          └───────────────────┬───────────────────┘
                              │
                              ▼
                    [GENERATING_FEATURES]
              Parallel Fault-Tolerant Generation
     ┌──────────────┬──────────────┬──────────────┬──────────────┐
     │  AI Summary  │ Smart Notes  │  Quiz MCQs   │  Flashcards  │
     └──────────────┴──────────────┴──────────────┴──────────────┘
                              │
                              ▼
                     Persist to Database
                   (Session & KnowledgeBase)
                              │
                              ▼
                           [READY]
```

### Pipeline Lifecycle Statuses

```text
PROCESSING → DOWNLOADING → EXTRACTING_AUDIO → TRANSCRIBING →
BUILDING_KNOWLEDGE_BASE → KNOWLEDGE_BASE_READY →
GENERATING_EMBEDDINGS → GENERATING_FEATURES → READY (or ERROR)
```

---

## 🏗 System Architecture & Tech Stack

### Frontend Application
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Library**: React 19.2.4
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, CSS Custom Properties Design System
- **Motion & Polish**: Framer Motion 12
- **Icons**: Lucide React
- **State Management**: Zustand
- **Database Client**: Prisma ORM 7.8 with `@prisma/adapter-pg`

### Backend AI Engine
- **Framework**: FastAPI (Async Python 3.x)
- **Transcription**: `faster-whisper` (int8 quantized CPU model)
- **LLM Reasoning**: Ollama (`llama3.1:8b`)
- **Structured Knowledge Extraction & Tutoring**: Google Gemini 2.5 Flash (`google-genai` SDK)
- **Embedding Model**: SentenceTransformers (`all-MiniLM-L6-v2`)
- **Vector Database**: ChromaDB (Persistent client, user/session scoped)
- **Media Ingestion**: `yt-dlp`, FFmpeg

### Database & Storage
- **Primary Database**: PostgreSQL hosted on Neon Serverless
- **Vector Storage**: Local ChromaDB persistent vector collection

---

## 📂 Data Models (Prisma)

### `User`
Manages identity and authentication:
- `id`: CUID identifier
- `name`: Full user name
- `email`: Unique email address
- `passwordHash`: bcrypt hashed credentials
- Relations: `Session[]`, `RefreshToken[]`

### `Session`
Stores individual lecture sessions:
- `id`: CUID identifier
- `userId`: Owner reference
- `title`: Video title or filename
- `source`: `UPLOAD` | `YOUTUBE`
- `status`: Current pipeline status enum
- `duration`: Video duration in seconds
- `videoUrl`, `thumbnail`: Media pointers
- `transcript`, `summary`, `notes`: Text fields
- `quiz`, `segments`, `flashcards`, `chapters`, `revision`: Structured JSON fields
- Relations: `KnowledgeBase?`, `TutorMessage[]`, `GeneratedFeature[]`

### `KnowledgeBase`
Normalized, persistent intelligence layer:
- `sessionId`: Unique link to Session
- `cleanedTranscript`: Cleaned text representation
- `status`: `PENDING` | `BUILDING` | `EXTRACTING` | `EMBEDDING` | `READY` | `ERROR`
- `topics`: Hierarchical topic taxonomy with importance weights
- `concepts`: Core terms, definitions, context, and timestamps
- `keyFacts`: High-value factual takeaways
- `relationships`: Semantic concept graph (`from_concept`, `to_concept`, `relation_type`)
- `learningObjectives`: Pedagogical learning goals
- `chapters`: Timestamped chapter metadata
- Relations: `TranscriptChunk[]`

### `TranscriptChunk`
Semantic chunks linked to KnowledgeBase:
- `knowledgeBaseId`: Parent reference
- `index`: Sequential ordering
- `text`: Chunk text (150–350 words)
- `startTime`, `endTime`: Precision timestamp boundaries
- `topicLabel`: Categorical association
- `importance`: Relevance weight

---

## 🛠 Getting Started

### Prerequisites

1. **Python 3.10+**
2. **Node.js 18+ & npm**
3. **FFmpeg** installed and accessible in your system `PATH`
4. **Ollama** installed with `llama3.1:8b` pulled (`ollama pull llama3.1:8b`)
5. **Gemini API Key** (for Knowledge Extraction, AI Tutor, and Revision modes)
6. **PostgreSQL Database** (Neon or local PostgreSQL)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXTJS_URL=http://localhost:3000
   INTERNAL_API_KEY=your_internal_service_secret
   OLLAMA_MODEL=llama3.1:8b
   WHISPER_MODEL=small
   CHROMA_DB_PATH=./chroma_db
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn app.main:router --host 127.0.0.1 --port 8000 --reload
   # Or using standard main:
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `frontend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
   JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_chars
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
   INTERNAL_API_KEY=your_internal_service_secret
   NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
   ```

4. Push Prisma schema or run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the Next.js development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Production Verification

- **Python Backend Type & Syntax**:
  ```bash
  python -m py_compile app/main.py app/workers/pipeline.py app/services/*.py
  ```
- **Next.js Production Build**:
  ```bash
  npm run build
  ```

---

## 🛡 Security & Best Practices

- **Zero Outside Hallucinations**: Prompts strictly mandate retrieval-grounded answers.
- **Cross-User Isolation**: Vector queries in ChromaDB enforce metadata filtering by `user_id`.
- **Protected Database Endpoints**: Inter-service communications between FastAPI and Next.js require `x-internal-key` authorization.
- **Safe Authentication**: Tokens stored in `HttpOnly`, `SameSite=Lax`, secure cookies with automatic silent refresh rotation.