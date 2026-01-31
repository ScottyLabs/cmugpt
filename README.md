# 🎓 CMUGPT (Nova Demo)

> *Because ChatGPT was taken, and we're from CMU, so... yeah.*

A full-stack multimodal AI chat application with MCP (Model Context Protocol) support. Built with FastAPI, React, and enough caffeine to power a small data center.

![API Keys Pushed](https://img.shields.io/badge/API%20Keys%20Pushed-0-brightgreen)
![Bugs](https://img.shields.io/badge/Bugs-Yes%20(but%20we%20call%20them%20features)-orange)

---

## 🔐 Security Achievement Unlocked

**🏆 ZERO API KEYS WERE HARMED (OR PUSHED) IN THE MAKING OF THIS REPOSITORY**

That's right. Not a single API key. No `OPENROUTER_API_KEY="sk-live-oops"` anywhere in the git history. No secret tokens embedded in the code like digital Easter eggs of shame. We use `.env` files like civilized developers.

*"But how do we know?"* — You can grep this entire repo and find nothing but responsible environment variable usage. We're basically the security equivalent of parallel parking on the first try.

```bash
# What you WON'T find in our git history:
git log -p | grep -i "api_key\|secret\|password" 
# Returns: Nothing. Nada. Zilch. 🎉
```

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│    OpenRouter   │
│  React + Vite   │     │     FastAPI     │     │   (The AI bit)  │
│   Port 3000     │     │    Port 8001    │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   MCP Servers   │
                        │ (Tool Calling)  │
                        └─────────────────┘
```

*It's not microservices, it's "appropriately-sized services."*

---

## 🚀 Features

- **🖼️ Multimodal Support** — Send images, PDFs, audio. We accept all forms of digital communication except fax (we're not *that* retro).
- **🔄 Streaming Responses** — Watch the AI think in real-time. It's like watching someone type, but smarter.
- **🛠️ MCP Integration** — Model Context Protocol support for tool calling. Your AI can now use tools, which is either exciting or terrifying depending on your perspective.
- **🔐 Clerk Authentication** — Because not everyone should have access to your AI (especially your ex).
- **💅 TailwindCSS + Liquid Glass UI** — So pretty it hurts. Your retinas will thank us.
- **⚡ TanStack Query & Router** — State management that doesn't make you question your career choices.

---

## 📁 Project Structure

```
cmugpt/
├── 🔙 backend/           # FastAPI backend (the brains)
│   ├── routers/          # API routes (chat, MCP)
│   ├── services/         # Business logic (where the magic happens)
│   └── models/           # Pydantic schemas (type safety go brrrr)
│
├── 🎨 frontend/          # React frontend (the beauty)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks (useEverything)
│   │   ├── routes/       # TanStack Router pages
│   │   └── utils/        # Helper functions
│   └── public/           # Static assets
│
└── 🚀 modal/             # Modal deployment scripts
    └── (GPU goes brrr)   # For when you want to self-host LLMs
```

---

## 🏃 Getting Started

### Prerequisites

- **Node.js** ≥ 18 (because we're not animals)
- **Python** ≥ 3.13 (living on the edge)
- **uv** — The fast Python package manager that makes pip feel like dial-up internet

### Backend Setup

```bash
cd backend

# Install dependencies (faster than you can say "dependency hell")
uv sync

# Activate the virtual environment
source .venv/bin/activate

# Create your .env file (WHERE YOU PUT YOUR API KEYS, NOT IN GIT)
echo "OPENROUTER_API_KEY=your-key-here" > .env

# Run the server
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create your .env file
echo "VITE_API_URL=http://localhost:8001" > .env

# Run the dev server
npm run dev
```

Now open http://localhost:3000 and prepare to be amazed (or at least mildly impressed).

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Pushed to Git? |
|----------|-------------|----------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | **ABSOLUTELY NOT** 🚫 |

### Frontend (`.env`)

| Variable | Description | Pushed to Git? |
|----------|-------------|----------------|
| `VITE_API_URL` | Backend API URL | Nope |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | Still no |

*Notice a pattern? Good. You're learning.*

---

## 🤖 Supported Models

We use OpenRouter, which means you get access to:
- GPT-4o (when you want to burn money elegantly)
- Claude 3.5 Sonnet (the eloquent one)
- Llama 3.3 70B (open source supremacy)
- And many more (seriously, there are so many)

---

## 🛠️ MCP (Model Context Protocol)

This app supports MCP servers for tool calling.

Configure your MCP servers in `backend/services/mcp_servers.json`:

```json
{
  "your_server": {
    "url": "https://your-mcp-server.example.com/mcp"
  }
}
```

---

## 🐳 Docker

Both frontend and backend come with Dockerfiles, because we believe in containerizing our problems:

```bash
# Backend
cd backend && docker build -t cmugpt-backend .

# Frontend  
cd frontend && docker build -t cmugpt-frontend .
```

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm run test

# Backend tests
cd backend && pytest  # (after you write them 👀)
```

---

<div align="center">

**Built with ❤️ and an unhealthy amount of screen time**

*Remember: Friends don't let friends push API keys to public repos.*

</div>
