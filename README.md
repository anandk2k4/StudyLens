# StudyLens AI

AI-powered video learning platform that converts educational videos into:

* Transcripts
* AI Summaries
* AI Notes
* Interactive Quizzes
* Semantic Search
* RAG-based Question Answering

---

# Features Completed

## 1. Video Upload System

Users can upload educational videos directly from the frontend.

### Implemented Using

* Next.js
* FastAPI
* Axios
* Multipart FormData

---

## 2. Audio Extraction

Audio is extracted from uploaded videos using FFmpeg.

### Implemented Using

* FFmpeg
* Python subprocess

### Output

* MP3 audio generated from uploaded video

---

# 3. Speech-to-Text Transcription

Video audio is converted into transcript text.

### Implemented Using

* OpenAI Whisper

### Features

* Full transcript generation
* Timestamped transcript segments
* Clickable video timestamps

---

# 4. AI Summary Generation

StudyLens generates AI-powered summaries from transcript context.

### Current Approach

* Important transcript segments are selected
* Context is passed to local LLM
* Grounded summary generated

### Implemented Using

* Ollama
* Phi model

### Problems Solved

* Reduced hallucinations
* Reduced character confusion
* Improved grounded summaries

---

# 5. AI Notes Generation

AI automatically creates concise study notes from transcript content.

### Features

* Bullet-point notes
* Important concept extraction
* Educational revision format

### Implemented Using

* Ollama
* Prompt engineering

---

# 6. Interactive Quiz Generation

AI generates MCQ-based quizzes from the transcript.

### Features

* Multiple choice questions
* 4 options per question
* Correct answer validation
* Interactive frontend quiz system
* Green/red answer feedback

### Implemented Using

* Ollama
* Custom quiz parser
* React state management

### Problems Solved

* JSON parsing failures
* Prompt leakage
* Answer mapping issues
* Early stopping generation

---

# 7. Semantic Transcript Search

Users can search transcript content semantically.

### Example

Searching:

```txt
kindness
```

can retrieve:

* helping
* friendship
* respect
* saving

without exact keyword matching.

### Implemented Using

* Sentence Transformers
* ChromaDB
* Embeddings
* Vector Search

---

# 8. RAG-Based Question Answering

StudyLens uses Retrieval-Augmented Generation for grounded AI answers.

### Flow

Question
→ Semantic Retrieval
→ Relevant Transcript Chunks
→ AI Answer Generation

### Features

* Reduced hallucinations
* Context-aware answers
* Grounded responses
* Long transcript handling

### Implemented Using

* ChromaDB
* Embeddings
* Ollama
* Phi model

---

# 9. Interactive Transcript Timeline

Users can click transcript segments to jump directly to that timestamp in the video.

### Features

* Timestamp navigation
* Interactive playback
* Semantic transcript exploration

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Axios

## Backend

* FastAPI
* Python
* Uvicorn

## AI / ML

* Whisper
* Ollama
* Phi model
* Sentence Transformers

## Vector Database

* ChromaDB

## Media Processing

* FFmpeg

---

# Current Project Architecture

```txt
Video Upload
    ↓
Audio Extraction (FFmpeg)
    ↓
Whisper Transcription
    ↓
Transcript Segments
    ↓
Embeddings Generation
    ↓
ChromaDB Vector Storage
    ↓
Semantic Search / RAG
    ↓
AI Features
- Summary
- Notes
- Quiz
- Q&A
```

---

# Backend APIs

## Upload API

```txt
POST /upload
```

### Returns

* transcript
* summary
* notes
* quiz
* timestamps
* video URL

---

## Semantic Search API

```txt
POST /search
```

### Input

```json
{
  "query": "friendship"
}
```

---

## AI Q&A API

```txt
POST /qa
```

### Input

```json
{
  "question": "What is the moral of the story?"
}
```

---

# Problems Solved During Development

## AI Hallucinations

Solved using:

* RAG
* grounded prompts
* transcript chunk selection

---

## JSON Parsing Errors

Solved using:

* custom quiz parser
* structured text generation

---

## Semantic Search Empty Results

Solved using:

* Persistent ChromaDB
* vector storage fixes

---

## Prompt Leakage

Solved using:

* improved prompt engineering
* grounded constraints

---

# Future Improvements

## 1. Modern SaaS UI

Planned improvements:

* sidebar layout
* tabs
* dark mode
* animations
* glassmorphism
* responsive design

---

## 2. Authentication

Planned:

* Clerk authentication
* user accounts
* protected dashboards

---

## 3. User Dashboard

Users will be able to:

* view uploaded videos
* access notes
* access quizzes
* manage learning sessions

---

## 4. Interactive Quiz System Improvements

Planned:

* scoring system
* quiz explanations
* progress tracking
* retry quiz

---

## 5. Flashcards Generation

AI-generated flashcards for revision.

---

## 6. AI Study Assistant

Future features:

* explain like beginner
* chapter-wise notes
* topic extraction
* revision assistant

---

## 7. Multi-Video RAG

Search and ask questions across multiple uploaded videos.

---

## 8. Deployment

Planned deployment:

* Vercel (Frontend)
* Render/Railway (Backend)
* Cloud vector database

---

# Local Setup

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Run backend:

```bash
uvicorn app.main:app --reload
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Required Software

## Install FFmpeg

FFmpeg is required for audio extraction.

## Install Ollama

Install Ollama locally and pull model:

```bash
ollama pull phi
```

---

# Current Project Status

StudyLens AI is currently in MVP stage.

The platform already supports:

* AI transcription
* Semantic search
* RAG-based QA
* AI notes
* AI quizzes
* Interactive learning workflows

The next phase focuses on:

* better UI/UX
* authentication
* cloud deployment
* advanced educational AI features

---

# Author

Built as an AI-powered educational learning platform project using modern AI engineering concepts including:

* RAG
* embeddings
* vector databases
* semantic retrieval
* local LLM inference
