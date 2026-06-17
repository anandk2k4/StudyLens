# 🎓 StudyLens AI

StudyLens AI is an AI-powered learning platform that transforms videos and YouTube lectures into structured study material. It automatically generates transcripts, summaries, notes, quizzes, flashcards, chapters, and provides AI-powered Q&A using Retrieval-Augmented Generation (RAG).

The goal of StudyLens AI is to turn passive video watching into an active learning experience.

---

# ✨ Features

## 📹 Video Processing

- Upload local videos
- Process YouTube lecture links
- Background processing (non-blocking)
- Session persistence
- Resume after page refresh or login

---

## 🎙 Transcription

Powered by **faster-whisper**

- Voice Activity Detection (VAD)
- int8 CPU inference
- Faster than OpenAI Whisper
- Segment timestamps

---

## 📝 AI Summary

Generate concise summaries from lectures.

---

## 📋 AI Notes

Generate clean bullet-point notes with post-processing.

---

## ❓ Interactive Quiz

Generate multiple-choice questions.

Features:

- Score tracking
- Reveal answers
- Retry support

---

## 🧠 Flashcards

Interactive flashcards with:

- Card flipping
- Navigation
- Completion screen

---

## 📖 Chapter Detection

Automatically detects topics and timestamps.

Example:

```text
00:00 Introduction
05:12 Variables
14:30 Loops
25:15 Functions
```

Users can click chapters to jump to that timestamp.

---

## 🔎 Semantic Search

Search transcript content semantically.

---

## 🤖 Single Video RAG

Ask questions about the currently opened lecture.

Features:

- Query expansion
- Context retrieval
- Chunk deduplication
- Neighbor merging
- Hallucination detection

---

## 🌍 Multi-Video RAG

Ask questions across all uploaded videos.

Examples:

```text
What common advice appears across my motivation videos?

What do all my lectures say about discipline?

Summarize everything I learned about Python.
```

Features:

- Cross-session retrieval
- Source attribution
- User isolation
- Session balancing

---

## ⚡ Parallel AI Generation

Runs simultaneously:

- Summary
- Notes
- Quiz
- Flashcards
- Chapters

using:

```python
asyncio.gather()
```

to reduce waiting time.

---

## 📊 Processing Pipeline

```text
Upload Video / YouTube URL
            │
            ▼
      Background Worker
            │
            ▼
      Audio Extraction
            │
            ▼
       Faster Whisper
            │
            ▼
         Embeddings
            │
            ▼
     Parallel AI Tasks
 ┌────────┬────────┬────────┬────────┬────────┐
 │Summary │ Notes  │ Quiz   │Cards   │Chapter │
 └────────┴────────┴────────┴────────┴────────┘
            │
            ▼
       Save to Database
            │
            ▼
            READY
```

---

# 🏗 Tech Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- Zustand
- Server Actions

## Backend

- FastAPI
- Python
- Ollama
- faster-whisper
- SentenceTransformers
- ChromaDB
- yt-dlp
- FFmpeg

## Database

- PostgreSQL (Neon)
- Prisma ORM

## Authentication

- JWT
- Refresh Tokens
- HttpOnly Cookies
- bcrypt

---

# 📂 Database Models

## User

Stores:

- Name
- Email
- Password hash

---

## Session

Stores:

- Video metadata
- Transcript
- Summary
- Notes
- Quiz
- Flashcards
- Chapters
- Status
- Source
- Duration

---

## RefreshToken

Stores:

- Refresh token
- Expiry date

---

# 🔐 Authentication

- Register
- Login
- Logout
- Access tokens
- Refresh tokens
- Silent token rotation
- Protected routes

---

# 📈 Progress Tracking

11 pipeline stages:

```text
PROCESSING
DOWNLOADING
EXTRACTING_AUDIO
TRANSCRIBING
GENERATING_EMBEDDINGS
GENERATING_SUMMARY
GENERATING_NOTES
GENERATING_QUIZ
GENERATING_FLASHCARDS
READY
ERROR
```

---

# 💾 Persistent Sessions

Everything is stored permanently:

- Transcript
- Summary
- Notes
- Quiz
- Flashcards
- Chapters

Users don't need to regenerate results.

---

# 🚀 Current Features

| Feature | Status |
|-----------|--------|
| Video Upload | ✅ |
| YouTube Processing | ✅ |
| Faster Whisper | ✅ |
| AI Summary | ✅ |
| AI Notes | ✅ |
| Interactive Quiz | ✅ |
| Flashcards | ✅ |
| Chapter Detection | ✅ |
| Semantic Search | ✅ |
| Single Video RAG | ✅ |
| Multi-Video RAG | ✅ |
| Background Processing | ✅ |
| Parallel AI Generation | ✅ |
| Session Persistence | ✅ |
| JWT Authentication | ✅ |
| Refresh Tokens | ✅ |
| Dashboard | ✅ |

---

# 🔮 Future Scope

## Session-Aware Assistant

Support queries like:

```text
What happened in session 2?

Summarize my latest lecture.

Compare session A and session B.
```

---

## Intent Router

Classify queries into:

- Session Query
- Knowledge Query
- Comparison Query
- Cross-Session Query

and route accordingly.

---

## Smarter Multi-Video Assistant

Current:

```text
Answer
```

Future:

```text
Lecture A says...

Lecture B says...

Common themes

Differences

Conclusion
```

---

## AI Tutor Mode

Transform StudyLens into an interactive teacher.

Example:

```text
Explain recursion
↓
Concept
↓
Example
↓
Practice Question
↓
Evaluate Answer
```

---

## Learning Analytics

Track:

- Study hours
- Quiz scores
- Topics studied
- Questions asked
- Sessions completed

---

## Revision Mode

Generate:

- 5-minute revision
- 10-minute revision
- Exam sheets
- Key concepts

---

## Chapter-Level RAG

Examples:

```text
Explain chapter 3.

Quiz me on chapter 5.
```

---

## Cross-Session Revision

Generate revision sheets from multiple videos.

---

## Knowledge Graph

Visualize learned concepts:

```text
AI
├── RAG
├── Transformers
└── LLMs

Python
├── Variables
├── Loops
└── Functions
```

---

## Long-Term Vision

StudyLens AI aims to evolve from:

```text
Video Summarizer
```

into

```text
Personal AI Knowledge Base
+
Interactive Tutor
+
Learning Assistant
```

inspired by:

- NotebookLM
- Khanmigo
- Perplexity
- AI Study Assistants

---

# ❤️ Built With

- FastAPI
- Next.js
- Ollama
- faster-whisper
- ChromaDB
- Prisma
- Neon PostgreSQL

---