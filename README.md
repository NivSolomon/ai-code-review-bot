<div align="center">

# 🤖 AI Code Review Assistant

**An intelligent, production-ready code review bot that automatically reviews pull requests using AI**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-black.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Configuration](#-configuration) • [API Reference](#-api-reference) • [Development](#-development)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Docker Deployment](#-docker-deployment)
- [Best Practices](#-best-practices)
- [Contributing](#-contributing)

---

## 🎯 Overview

The **AI Code Review Assistant** is a sophisticated microservices-based system that integrates with GitHub to provide automated code reviews on pull requests. It leverages OpenAI's language models to analyze code diffs and provide intelligent, contextual feedback directly in GitHub pull requests.

### Key Highlights

- ✨ **Intelligent Code Analysis** - Uses advanced AI to understand code context and provide meaningful reviews
- 🔒 **Production-Ready** - Built with security, reliability, and scalability in mind
- 🚀 **Easy Integration** - Simple GitHub webhook setup
- 📦 **Monorepo Architecture** - Clean, modular codebase with shared types
- 🐳 **Docker Support** - Containerized deployment ready
- 🔍 **Comprehensive Logging** - Structured logging with request tracking
- ⚡ **Performance Optimized** - Rate limiting, retry logic, and graceful shutdown

---

## ✨ Features

### Core Functionality

- **🤖 AI-Powered Reviews** - Automatically reviews code changes using OpenAI GPT models
- **📝 GitHub Integration** - Seamlessly integrates with GitHub webhooks
- **💬 Inline Comments** - Posts review comments directly on GitHub pull requests
- **🔍 Diff Analysis** - Analyzes code diffs to provide contextual feedback
- **🌐 Multi-Language Support** - Works with various programming languages

### Production Features

- **🔒 Security**
  - GitHub webhook signature verification
  - Rate limiting to prevent abuse
  - Request size limits
  - Input validation with Zod schemas
  - Environment variable validation

- **📊 Observability**
  - Structured logging with Winston
  - Request ID tracking for debugging
  - Health check endpoints
  - Comprehensive error handling

- **⚡ Reliability**
  - Retry logic with exponential backoff
  - Request timeouts
  - Graceful shutdown handling
  - Dependency health checks

- **🏗️ Architecture**
  - Microservices design
  - Shared type definitions
  - TypeScript for type safety
  - Modular, maintainable codebase

---

## 🏗️ Architecture

The project follows a **microservices architecture** with two main services:

```
┌─────────────────────────────────────────────────────────────┐
│                       GitHub Repository                     │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               │
        1. Webhook Event (pull_request)   7. Review Comments
                │                               ▲
                ▼                               │
┌─────────────────────────────────────────────────────────────┐
│              Webhook Service (Port 4001)                    │
│                                                             │
│  1. Receives GitHub webhooks                                │
│  2. Validates webhook signatures                            │
│  3. Fetches PR diffs via GitHub API                         │
│  4. Sends diff + metadata to Review Service                 │
│  5. Receives AI review results                              │
│  6. Posts review comments back to GitHub PR                 │
│                                                             │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               ▲
        4. HTTP Request (diff + metadata)  5. HTTP Response
                │                               │
                ▼                               │
┌─────────────────────────────────────────────────────────────┐
│              Review Service (Port 4002)                     │
│                                                             │
│  • Receives code diff and PR metadata                       │
│  • Validates input using Zod schemas                        │
│  • Sends diff to OpenAI API                                 │
│  • Parses AI response into structured comments              │
│  • Returns review results to Webhook Service                │
│                                                             │
└───────────────┬───────────────────────────────┬─────────────┘
                │                               ▲
        OpenAI API Request                OpenAI API Response
                │                               │
                ▼                               │
┌─────────────────────────────────────────────────────────────┐
│                    OpenAI GPT Models                        │
│                                                             │
│  • Analyze code diffs                                       │
│  • Generate review comments and summaries                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

```

**Complete Flow:**
1. GitHub sends webhook event when PR is opened/updated
2. Webhook Service validates the webhook signature
3. Webhook Service fetches the PR diff from GitHub API
4. Webhook Service forwards the diff to Review Service
5. Review Service sends diff to OpenAI and receives AI review
6. Review Service returns structured comments to Webhook Service
7. **Webhook Service posts AI review comments back to GitHub PR** ✨

### Project Structure

```
ai-code-review-assistant/
├── packages/
│   └── shared/
│       └── types/              # Shared TypeScript types
├── services/
│   ├── webhook-service/        # GitHub webhook handler
│   │   ├── src/
│   │   │   ├── routes/         # Express routes
│   │   │   ├── middleware/     # Rate limiting, validation, etc.
│   │   │   ├── github/         # GitHub API client
│   │   │   └── utils/          # Logging, HTTP client
│   │   └── Dockerfile
│   └── review-service/         # AI code review service
│       ├── src/
│       │   ├── routes/          # Review API endpoints
│       │   ├── middleware/      # Rate limiting, validation
│       │   ├── llmClient.ts     # OpenAI client
│       │   └── utils/           # Logging, HTTP client
│       └── Dockerfile
├── docker-compose.yml          # Docker orchestration
├── package.json                # Root package.json
└── pnpm-workspace.yaml         # pnpm workspace config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **GitHub Personal Access Token** with `repo` scope
- **OpenAI API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-code-review-assistant.git
   cd ai-code-review-assistant
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # Or use the convenience script
   npm run install:all
   ```

3. **Build all packages**
   ```bash
   npm run build
   ```

### Running Locally

1. **Set up environment variables**

   Create `.env` files for each service:

   **`services/webhook-service/.env`:**
   ```env
   GITHUB_TOKEN=your_github_token_here
   GITHUB_WEBHOOK_SECRET=your_webhook_secret_optional
   REVIEW_SERVICE_URL=http://localhost:4002
   PORT=4001
   ```

   **`services/review-service/.env`:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=4002
   ```

2. **Start the services**

   **Terminal 1 - Review Service:**
   ```bash
   cd services/review-service
   pnpm dev
   ```

   **Terminal 2 - Webhook Service:**
   ```bash
   cd services/webhook-service
   pnpm dev
   ```

3. **Verify services are running**
   ```bash
   # Check review service
   curl http://localhost:4002/health
   
   # Check webhook service
   curl http://localhost:4001/health
   ```

### GitHub Webhook Setup

1. Go to your GitHub repository → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-domain.com/github/webhook` (or use ngrok for local testing)
   - **Content type**: `application/json`
   - **Secret**: (optional) Your `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select **Pull requests**
4. Click **Add webhook**

**For local testing**, use [ngrok](https://ngrok.com/):
```bash
ngrok http 4001
# Use the ngrok URL as your webhook payload URL
```

---

## ⚙️ Configuration

### Environment Variables

#### Webhook Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ Yes | - | GitHub Personal Access Token |
| `GITHUB_WEBHOOK_SECRET` | ❌ No | - | Webhook secret for signature verification |
| `REVIEW_SERVICE_URL` | ✅ Yes | `http://localhost:4002` | Review service URL |
| `PORT` | ❌ No | `4001` | Server port |
| `MAX_REQUEST_SIZE` | ❌ No | `10mb` | Maximum request body size |
| `RATE_LIMIT_WINDOW_MS` | ❌ No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | ❌ No | `100` | Max requests per window |
| `LOG_LEVEL` | ❌ No | `info` | Logging level (info, warn, error, debug) |
| `TRUST_PROXY` | ❌ No | `false` | Trust proxy headers (for rate limiting) |

#### Review Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `PORT` | ❌ No | `4002` | Server port |
| `MAX_DIFF_SIZE` | ❌ No | `1000000` | Maximum diff size in bytes (1MB) |
| `MAX_REQUEST_SIZE` | ❌ No | `10mb` | Maximum request body size |
| `RATE_LIMIT_WINDOW_MS` | ❌ No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | ❌ No | `100` | Max requests per window |
| `LOG_LEVEL` | ❌ No | `info` | Logging level |
| `TRUST_PROXY` | ❌ No | `false` | Trust proxy headers |

---

## 📡 API Reference

### Review Service

#### `POST /review`

Analyzes a code diff and returns AI-generated review comments.

**Request Body:**
```json
{
  "repo": "owner/repo-name",
  "prNumber": 123,
  "diff": "diff --git a/file.ts b/file.ts\n...",
  "language": "typescript"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Overall review summary",
    "comments": [
      {
        "path": "src/file.ts",
        "line": 42,
        "body": "Consider adding error handling here",
        "side": "RIGHT"
      }
    ]
  },
  "requestId": "uuid-here"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { ... },
    "requestId": "uuid-here"
  }
}
```

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "service": "ok",
  "openai": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": "3600s"
}
```

### Webhook Service

#### `POST /github/webhook`

GitHub webhook endpoint (handled automatically by GitHub).

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "webhook-service",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

---

## 💻 Development

### Project Scripts

```bash
# Install all dependencies
npm run install:all

# Build all packages
npm run build

# Build specific package
npm run build:types
npm run build:webhook
npm run build:review

# Type checking
npm run type-check

# Linting
npm run lint
```

### Development Workflow

1. **Make changes** to the source code
2. **Type check** your changes:
   ```bash
   npm run type-check
   ```
3. **Lint** your code:
   ```bash
   npm run lint
   ```
4. **Build** before testing:
   ```bash
   npm run build
   ```
5. **Run** services in development mode:
   ```bash
   cd services/review-service && pnpm dev
   cd services/webhook-service && pnpm dev
   ```

### Code Structure

- **TypeScript** - Strict type checking enabled
- **ESLint** - Code quality and consistency
- **Modular Design** - Clear separation of concerns
- **Shared Types** - Common types in `packages/shared/types`

### Adding New Features

1. **Shared Types**: Add to `packages/shared/types/src/`
2. **Review Service**: Add routes in `services/review-service/src/routes/`
3. **Webhook Service**: Add routes in `services/webhook-service/src/routes/`
4. **Middleware**: Add to respective `middleware/` directories
5. **Utils**: Add to respective `utils/` directories

---

## 🐳 Docker Deployment

### Using Docker Compose

1. **Create environment files**

   **`services/webhook-service/.env.docker`:**
   ```env
   GITHUB_TOKEN=your_token
   REVIEW_SERVICE_URL=http://review-service:4002
   PORT=4001
   ```

   **`services/review-service/.env.docker`:**
   ```env
   OPENAI_API_KEY=your_key
   PORT=4002
   ```

2. **Build and run**
   ```bash
   docker-compose up --build
   ```

3. **Access services**
   - Webhook Service: `http://localhost:4001`
   - Review Service: `http://localhost:4002`

### Individual Docker Builds

```bash
# Build review service
cd services/review-service
docker build -t review-service .

# Build webhook service
cd services/webhook-service
docker build -t webhook-service .
```

---

## 🎯 Best Practices

This project implements numerous production-ready best practices:

### Security ✅
- ✅ GitHub webhook signature verification
- ✅ Rate limiting (100 req/15min default)
- ✅ Request size limits (10MB default)
- ✅ Input validation with Zod schemas
- ✅ Environment variable validation

### Reliability ✅
- ✅ Request timeouts (30s default)
- ✅ Retry logic with exponential backoff
- ✅ Graceful shutdown handling
- ✅ Comprehensive error handling
- ✅ Health check endpoints

### Observability ✅
- ✅ Structured logging with Winston
- ✅ Request ID tracking
- ✅ Error tracking with context
- ✅ Dependency health checks

### Code Quality ✅
- ✅ TypeScript strict mode
- ✅ ESLint configuration
- ✅ Modular architecture
- ✅ Shared type definitions
- ✅ Comprehensive error types

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Run** tests and linting (`npm run type-check && npm run lint`)
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation as needed
- Ensure all checks pass before submitting PR

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for the powerful language models
- [GitHub](https://github.com/) for the excellent API
- [Express.js](https://expressjs.com/) for the web framework
- [TypeScript](https://www.typescriptlang.org/) for type safety

---

<div align="center">

⭐ **Star this repo if you find it helpful!** ⭐

</div>
