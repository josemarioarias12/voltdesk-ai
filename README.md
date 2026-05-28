# PulseDesk AI

> Enterprise Operational Intelligence Platform — Native AI SaaS multi-tenant.

PulseDesk AI eliminates operational overhead for medium and large companies. It unifies support, HR, IT assets, and operations under a single system that doesn't just record — it classifies, prioritizes, and automatically generates actionable decisions with GPT-4o.

**Technical internship — Office Space Software · 14 weeks · Final presentation: August 2026**

## Architecture

┌─────────────────────────────────────────────────────────────┐
│                     MONOREPO: pulsedesk-ai                   │
│                                                              │
│  ┌─────────────────┐        ┌─────────────────────────────┐  │
│  │   Rails 8       │        │   React 18 + TypeScript     │  │
│  │                 │        │                             │  │
│  │  Controllers    │◄──────►│  Inertia Pages              │  │
│  │  Service Objs   │  Props │  Components                 │  │
│  │  Pundit Policies│        │  Hooks                      │  │
│  │  ActiveRecord   │        │  Zustand Store              │  │
│  └────────┬────────┘        └─────────────────────────────┘  │
│           │                                                   │
│  ┌────────▼────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL 16   │  │ Redis 7  │  │ Sidekiq 7            │ │
│  │ + pgvector HNSW │  │          │  │ (AI Processing)      │ │
│  │ (RAG, 1536-dim) │  │ Cache    │  │ ai_processing queue  │ │
│  └─────────────────┘  │ Pub/Sub  │  │ notifications queue  │ │
│                        └──────────┘  └──────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  AI Layer: GPT-4o · text-embedding-3-large · pgvector  │   │
│  │  Classification · RAG · XAI · Mandatory AiAuditLog     │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘


## Setup in 3 commands

```bash
git clone https://github.com/josemarioarias12/pulsedesk-ai.git
cd pulsedesk-ai
cp .env.example .env          # Fill in OPENAI_API_KEY and GOOGLE_CLIENT_ID
docker-compose up             # Starts api + db + redis + sidekiq
```

Open http://localhost:3100 — the app should be running in under 5 minutes.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Rails 8 (monorepo) | Serves backend AND frontend in 1 repo with Inertia — no CORS, no JWT, no separate API |
| ORM | ActiveRecord + pgvector | Everything in the same DB. neighbor integrates vectors with ActiveRecord natively |
| Bridge | Inertia.js | Rails sends props directly to React. No fetch, no Apollo, no GraphQL |
| Frontend | React 18 + TypeScript strict | Full typing. `any` forbidden. Errors at compile-time, not runtime |
| UI | TailwindCSS v4 + shadcn/ui | Accessible components on Radix UI. No custom CSS |
| AI | GPT-4o + text-embedding-3-large | Classification, RAG, XAI, reports. AiAuditLog mandatory on every call |
| Vectors | pgvector HNSW | 98%+ recall. In the same PostgreSQL — $0 extra vs Pinecone |
| Jobs | Sidekiq 7 + Redis 7 | All AI processing in background. User never waits for OpenAI |
| Auth | Devise + Google OAuth2 | Corporate SSO. Native Rails session — no expiring JWT |
| Authorization | Pundit | Policy per resource. Secure multi-tenant. 100% testable in RSpec |
| Voice | Web Speech API | Native browser API. $0. Audio never leaves the device |

## Running Tests

```bash
# Backend — RSpec with coverage
bundle exec rspec

# TypeScript — type checking
npx tsc --noEmit

# Linting
bundle exec rubocop
```

## Branch Strategy

| Branch | Role | Deploy |
|--------|------|--------|
| `dev01` | Active development — day-to-day work | CI: rubocop + tsc + rspec |
| `qa` | Staging — integration testing | CI + Auto deploy to Railway |
| `main` | Production — merges from approved qa only | CI + Deploy to production |

## Key Technical Decisions

**Why monorepo instead of 3 repositories?**
One repo = one `git clone`, one CI/CD, one deploy. No CORS. No JWT. The evaluator clones 1 repo and runs 1 command.

**Why pgvector instead of Pinecone?**
pgvector runs in the same existing PostgreSQL. $0 additional cost. 98%+ recall with HNSW index. Pinecone costs $70+/month and adds an external dependency.

**Why Web Speech API instead of Whisper?**
Audio processed on the user's device — never sent to the server. $0 cost. No system dependencies (ffmpeg, audio gems). Works offline.

**Why Inertia.js instead of a SPA with REST API?**
Rails sends props directly to React without HTTP serialization. No `fetch`, no `axios`, no network loading state management, no JWT, no CORS. Authentication uses Rails session cookie.

## MVP Modules (guaranteed Sprint 1-9)

1. Smart Ticket Engine — auto SLA, load-based assignment, voice, XAI
2. AI Engine — GPT-4o + RAG pgvector + complete AiAuditLog
3. Auth + Multi-tenancy — Google OAuth, isolated workspaces, 9 roles
4. Voice-to-Ticket — Web Speech API, classified in 3 seconds
5. QR Demo Mode — Redis token 30min, max 50 simultaneous guests
6. HR — leave requests + AI onboarding plans by role
7. IT Asset Management — inventory + AI risk scoring
8. Analytics Dashboards — Employee, Manager, Executive
9. Notification Center — ActionCable real-time
10. Admin Control Center — AI Audit Log + cost tracking

---

*PulseDesk AI · github.com/josemarioarias12/pulsedesk-ai · May 2026*