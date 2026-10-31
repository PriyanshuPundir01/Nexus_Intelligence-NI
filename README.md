# 🧠 NexusRAG — Multimodal AI Knowledge Hub
### Fullstack Retrieval-Augmented Generation (RAG) for PDFs, Images & Links

NexusRAG is a fullstack Multimodal RAG application powered by **Google Gemini AI**. It allows you to add any **PDF document**, **Image/Diagram (with Vision OCR)**, or **Web/YouTube Link**, indexes the content into a unified vector knowledge base, and lets you ask any question with strictly grounded, citation-backed answers.

---

## 🌟 Key Capabilities

### 1. 📄 PDF Ingestion
- Upload single or multiple PDF documents (up to 100 MB each).
- Automatic text extraction, table preservation, and semantic chunking (1,000 characters with 200-character overlap).
- Indexed into the in-memory vector store with page numbers and metadata.

### 2. 🖼️ Multimodal Image & Diagram Vision OCR
- Upload charts, diagrams, infographics, screenshots, and whiteboard photos (PNG, JPG, WEBP).
- **Gemini Vision** automatically extracts:
  - Verbatim text / OCR from the image.
  - Architectural flows, node relationships, tables, and numeric values.
  - Semantic summaries indexed directly into the RAG vector store.
- You can ask questions about the diagram (e.g. *"Explain the architecture shown in the uploaded diagram"*).

### 3. 🔗 Web Links & YouTube Video Ingestion
- Paste any **web article or documentation URL**: cleans HTML scripts and styles, extracts body content, chunks, and indexes.
- Paste any **YouTube video link**: extracts video transcript and educational notes, indexing them for conversational Q&A.

### 4. 💬 Grounded Conversational Q&A
- Natural language query interface powered by **Gemini 3.6 Flash / Gemini 3.5 Flash** using your Google API Key.
- **Top-k=4 semantic retrieval** across all uploaded documents, images, and links simultaneously.
- **Verified Source Citations**: Every answer provides an expandable citations drawer showing the exact chunk text, source name, and relevance score.
- **Hallucination Prevention**: If your uploaded sources do not contain the answer, the AI explicitly states it cannot find the information in the provided materials.

### 5. 🎨 Modern Cyberpunk UI
- Centered pill-shaped chat composer with integrated attachment shortcuts.
- Sources sidebar showing all active PDFs, Images, and Links with chunk counters and delete controls.
- Dynamic **Dark Mode** & **Light Mode** theming with glassmorphism and subtle glow effects.

---

## 🚀 Getting Started

The project includes an automatic runner that boots both the backend and frontend together:

```bash
# Start both Backend (port 5000) and Frontend (port 5173)
npm run dev
```

Or run them individually:

```bash
# Start Backend
npm run server

# Start Frontend
npm run client
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🛠️ Tech Stack & Configuration

- **Frontend:** React, Vite, Lucide Icons, Canvas Confetti, Vanilla CSS Design System.
- **Backend:** Node.js, Express.js, Multer, `pdf-parse`, `youtube-transcript`, CORS, Dotenv.
- **AI Engine:** Google Gemini API (`gemini-3.6-flash`, `gemini-3.5-flash` with automatic failover).
- **API Key Configuration:** Located in `server/.env` (`GOOGLE_API_KEY=...`).
