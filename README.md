# 🚀 CodeCoachAI – Enterprise AI Coding Assistant

> An AI-powered coding assistant that helps developers understand, debug, optimize, review, and interact with codebases using Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and GitHub repository analysis.

---

## 📌 Overview

CodeCoachAI is a full-stack AI developer platform inspired by tools like **ChatGPT, GitHub Copilot, Cursor, and CodeRabbit**. It combines conversational AI with intelligent code analysis to help developers write better code, understand large projects faster, and improve software quality.

The application supports multiple AI providers, semantic code search, GitHub repository analysis, file uploads, project chat, and an interactive code editor.

---

# ✨ Features

### 🤖 AI Chat Assistant
- Context-aware AI conversations
- Streaming responses (Server-Sent Events)
- Conversation memory
- Supports multiple LLM providers

### 📂 Intelligent Project Analysis
- Analyze complete GitHub repositories
- Upload ZIP files or project folders
- Parse project structure automatically
- Generate code quality reports

### 🔍 Retrieval-Augmented Generation (RAG)
- Semantic code search using embeddings
- Context-aware code explanations
- Understands large codebases efficiently
- Retrieves relevant code before answering

### 💻 AI Coding Tools
- Explain Code
- Debug Code
- Optimize Code
- Generate Unit Tests
- Generate Documentation
- Improve Readability

### 📝 Monaco Code Editor
- Syntax highlighting
- Multiple file tabs
- Modern editor experience
- Code viewing inside browser

### 📊 GitHub Repository Analyzer
- Repository cloning
- Project statistics
- Code quality scoring
- Security analysis
- Architecture insights

### 👤 User Management
- JWT Authentication
- Secure Login/Register
- Profile Management
- Settings Dashboard

### ⚙️ AI Configuration
Supports multiple AI providers including:

- Google Gemini
- Groq
- OpenRouter
- Ollama (Local LLM)

Users can configure:

- API Keys
- AI Model
- Temperature
- Max Tokens

---

# 🏗️ System Architecture

```
                ┌──────────────────────┐
                │      React Frontend  │
                └──────────┬───────────┘
                           │
                     REST APIs
                           │
                ┌──────────▼───────────┐
                │ Express + TypeScript │
                └───────┬───────┬──────┘
                        │       │
                 Prisma ORM   Redis
                        │
                 PostgreSQL Database
                        │
                 ChromaDB Vector Store
                        │
                 Embedding Search (RAG)
                        │
                Multiple AI Providers
```

---

# 🛠 Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Monaco Editor

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- ChromaDB
- JWT Authentication
- Zod Validation

---

## AI Technologies

- Google Gemini
- Groq
- OpenRouter
- Ollama

---

# 📁 Project Structure

```
CodeCoachAI/

├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── store/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── prisma/
│   │   └── interfaces/
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/CodeCoachAI.git

cd CodeCoachAI
```

---

## Start Required Services

```bash
docker-compose up -d
```

This starts:

- PostgreSQL
- Redis
- ChromaDB

---

## Backend Setup

```bash
cd backend

npm install

cp .env.example .env

npx prisma generate

npx prisma migrate dev

npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

# 🔐 Environment Variables

Example:

```env
DATABASE_URL=

JWT_SECRET=

GEMINI_API_KEY=

GROQ_API_KEY=

OPENROUTER_API_KEY=

REDIS_URL=
```

---

# 📚 API Modules

- Authentication
- Chat
- Project Analysis
- GitHub Analysis
- File Upload
- AI Services
- User Settings
- Profile Management

---

# 🔍 Key Concepts Used

- Retrieval-Augmented Generation (RAG)
- Vector Databases
- Semantic Search
- Repository Pattern
- Service Layer Architecture
- REST APIs
- JWT Authentication
- AI Streaming
- Embedding Search
- Repository Analysis

---

# 🎯 Future Improvements

- Voice AI Assistant
- Code Auto-Completion
- VS Code Extension
- Pull Request Review Bot
- Docker Deployment
- Kubernetes Support
- Team Collaboration
- Real-Time Multiplayer Editing
- CI/CD Integration

---

# 📈 Why This Project?

This project demonstrates practical software engineering skills by combining modern web development with AI technologies. It showcases expertise in:

- Full-Stack Development
- System Design
- Backend Architecture
- Authentication & Security
- REST API Development
- AI Integration
- Vector Databases
- Large Language Models (LLMs)
- Retrieval-Augmented Generation (RAG)
- GitHub API Integration

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push to branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Anu Luhach**

Software Developer | Full Stack Developer | AI Enthusiast

If you found this project useful, don't forget to ⭐ the repository.