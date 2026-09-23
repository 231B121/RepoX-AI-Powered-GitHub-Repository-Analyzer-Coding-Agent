# RepoX — AI-Powered GitHub Repository Health Analyzer & Coding Agent

RepoX is an automated repository health audit platform and AI coding agent. It connects to any public GitHub repository, performs deep multi-engine static analysis across code quality, dependencies, security, tests, and documentation, calculates a comprehensive health score, and can autonomously generate, validate, and open Pull Requests for detected issues.

Live Application:
- Frontend: https://repo-x-ai-powered-git-hub-repositor.vercel.app
- Backend: https://repox-ai-powered-github-repository.onrender.com

---

## Table of Contents

- Overview
- How It Works
- Core Features
- System Architecture
- Tech Stack
- Project Structure
- Local Development Setup
- Environment Variables
- API Reference
- Deployment

---

## Overview

Modern software repositories often accumulate technical debt, outdated dependencies, exposed credentials, and untested critical files. RepoX automates the entire audit and remediation workflow:

1. Ingests a GitHub repository URL and maps its file tree.
2. Runs five specialized static analysis engines in parallel.
3. Produces an audit dashboard with a health score (0-100) and severity grading.
4. Uses LLMs to explain the root cause and impact of each finding.
5. Generates fix patches, validates them in an execution sandbox, and creates automated GitHub Pull Requests.

---

## How It Works

1. **Repository Ingestion:**
   User enters a GitHub repository URL (e.g. `https://github.com/owner/repo`). The backend parses the owner and repo name, verifies access via the GitHub API (Octokit), fetches the repository metadata, and builds an index of the repository tree.

2. **Diagnostic Audit:**
   User clicks "Start Health Scan". The backend initiates the analysis pipeline:
   - Outdated dependencies and deprecated packages check
   - Security scanning for exposed API keys, secret tokens, and unsafe functions
   - ESLint static analysis for code quality, syntax errors, and logic traps
   - Test suite coverage assessment based on naming conventions
   - Documentation audit checking root README sections

3. **Scoring & Report:**
   Issues are categorized into CRITICAL, HIGH, MEDIUM, and LOW severity. A health score from 0 to 100 with grade tags (A+, A, B, C, D) is calculated and displayed on the interactive dashboard.

4. **AI-Powered Remediation:**
   - **Explain:** The developer can click "Explain with AI" to get context on why the issue exists and its real-world risk.
   - **Auto-Fix:** The AI agent analyzes the source code, generates a unified diff patch, verifies the fix in a sandbox environment, and can open a Pull Request directly on GitHub.

---

## Core Features

### 1. Five Specialized Analyzers
- **Dependency Audit:** Checks `package.json` files against the npm registry API to detect major and minor version drift and flags deprecated packages (such as `request` or `node-uuid`).
- **Security & Secret Scanner:** Detects hardcoded AWS keys, GitHub personal access tokens, private cryptographic keys, Slack webhooks, Stripe keys, database URIs, `eval()` calls, and unescaped HTML injections.
- **Code Quality Engine:** Runs ESLint with custom configurations targeting syntax bugs, unused variables, duplicate object keys, and unreachable code branches.
- **Testing Coverage Audit:** Discovers test files (`*.test.js`, `*.spec.js`, `__tests__/`) and identifies untested business logic modules in source directories.
- **Documentation Audit:** Validates that the repository contains a `README.md` with installation guides, environment configurations, usage instructions, and licensing.

### 2. Autonomous Fix Agent
- Generates precise unified diff patches for detected issues using LLMs (Groq / Google Gemini).
- Validates changes in an isolated runner sandbox before opening a PR.
- Opens Pull Requests with structured explanations and testing checklists.

### 3. Resilient Asynchronous Processing
- Supports Redis / Bull queues for distributed asynchronous worker jobs.
- Includes automatic direct in-process background execution fallback when running on single-instance cloud platforms without Redis (such as Render free tier).

---

## System Architecture

```text
[ React 18 Frontend (Vite + Vercel) ]
                 │
                 │ REST API (JSON / CORS)
                 ▼
[ Express.js Backend (Node.js on Render) ]
   ├── GitHub Service (Octokit REST API)
   ├── Analysis Pipeline (5 Diagnostic Engines)
   ├── Queue Manager (Bull Queue + Redis / Direct In-Process Fallback)
   ├── AI Agent Service (Groq / Google Gemini API)
   ├── Sandbox Runner (Docker Container / Host Fallback)
   └── Database Layer (MongoDB Atlas via Mongoose)
```

---

## Tech Stack

### Frontend
- **Framework:** React 18 (Vite)
- **Styling:** Custom responsive CSS3 with dark/light theme support
- **Icons:** Lucide React
- **Hosting:** Vercel

### Backend
- **Runtime:** Node.js (v18 - v24 compatible)
- **Web Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Background Jobs:** Bull Queue with Redis (and resilient in-process fallback)
- **GitHub Integration:** `@octokit/rest`
- **Linting & AST:** ESLint API
- **Semver Parsing:** Semver & npm registry API
- **Hosting:** Render Web Service

### AI & LLM
- Groq Cloud API (Qwen / LLaMA models)
- Google Gemini API

---

## Project Structure

```text
RepoX/
├── backend/
│   ├── agent/               # AI patch generator, fix planner, validator
│   ├── analyzer/            # 5 analysis engines (dependencies, security, quality, tests, docs)
│   ├── config/              # MongoDB connection and database status
│   ├── controllers/         # Express route controllers (repository, scan, issue, fix)
│   ├── core/                # System audit utilities
│   ├── github/              # Octokit client, PR creation service, repo tree fetcher
│   ├── jobs/                # Full scan execution pipeline
│   ├── middleware/          # Request logging and security middleware
│   ├── models/              # Mongoose schemas (Repository, Scan, Issue, Fix)
│   ├── queue/               # Bull queue setup and fallback logic
│   ├── routes/              # Express API route declarations
│   ├── sandbox/             # Docker sandbox and host runtime fallback runner
│   ├── server.js            # Express application entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Navbar, ScanDashboard, IssuesExplorer, etc.)
│   │   ├── App.jsx          # Main application component & polling state
│   │   ├── App.css          # Application styles and design system
│   │   └── config.js        # Dynamic API base URL configuration
│   ├── index.html           # HTML entry point
│   ├── vite.config.js       # Vite build configuration
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB instance (local or MongoDB Atlas connection string)
- Optional: Redis server (local or Upstash)
- GitHub Personal Access Token (for Octokit API rate limits)
- Groq API Key or Google Gemini API Key (for AI fixes and explanations)

### 1. Clone the repository
```bash
git clone https://github.com/231B121/RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent.git
cd RepoX-AI-Powered-GitHub-Repository-Analyzer-Coding-Agent
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/repox
GITHUB_TOKEN=your_github_personal_access_token
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173

# Optional: set only if using remote Redis (leave empty for automatic direct background scans)
# REDIS_URL=rediss://default:password@host.upstash.io:6379
```

Start the backend development server:
```bash
npm run dev
# or
node server.js
```
The backend will run at `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port number for Express server (default: 5000) |
| `MONGO_URI` | Yes | MongoDB connection string (local or MongoDB Atlas) |
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token for GitHub REST API |
| `GROQ_API_KEY` | Optional | Groq API key for fast LLM reasoning |
| `GROQ_MODEL` | Optional | Model identifier (e.g. `qwen/qwen3.8-27b` or `llama-3.3-70b-versatile`) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key as fallback LLM |
| `REDIS_URL` | Optional | Redis connection string. If omitted, scans run in direct background mode |
| `CLIENT_URL` | Optional | Allowed frontend origin for CORS |
| `SEPARATE_WORKER` | Optional | Set to `true` if running worker in a standalone process |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Optional | Target backend URL (defaults to production Render backend if unset) |

---

## API Reference

### Health Check
- `GET /health` — Check server status, database connection, and uptime.

### Repositories
- `POST /api/repositories/ingest` — Ingest a GitHub repository by URL.
  - Request body: `{ "url": "https://github.com/owner/repo" }`
  - Response: `{ repositoryId, metadata, fileCount, tree }`

### Scans
- `POST /api/repositories/:id/scans` — Start a diagnostic health scan.
  - Response: `{ scanId, status: "PENDING" }`
- `GET /api/scans/:scanId` — Poll status and retrieve completed audit findings.
  - Response: `{ scan: { status, totalIssues, byCategory }, issues: [...] }`

### Issues & AI Actions
- `POST /api/issues/:id/analyze` — Request AI explanation for a specific issue.
  - Response: `{ explanation: { cause, impact, recommendation } }`
- `POST /api/issues/:id/fix` — Request AI-generated code patch and fix plan.
  - Response: `{ agentRunId, patch, explanation, status }`
- `POST /api/issues/runs/:agentRunId/validate` — Validate generated patch in sandbox.
  - Response: `{ passed, stdout, stderr, runId }`
- `POST /api/fixes/runs/:agentRunId/pr` — Open a GitHub Pull Request with the fix.
  - Response: `{ prUrl, prNumber, branchName }`

---

## Deployment

### Backend (Render)
- Deploy as a **Web Service** connected to the repository.
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables: `MONGO_URI`, `GITHUB_TOKEN`, `GROQ_API_KEY`, etc.

### Frontend (Vercel)
- Deploy as a Vite project connected to the repository.
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variable (optional): `VITE_API_URL` set to your Render backend URL.

---

## License

This project is licensed under the MIT License.
