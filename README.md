# VoltDesk AI

> Enterprise Operational Intelligence Platform — Multi-tenant SaaS with native AI.

VoltDesk AI eliminates operational overhead for medium and large enterprises. It unifies support ticketing, HR operations, IT asset management, and workplace analytics under a single system that doesn't just record — it classifies, prioritizes, and converts information into actionable decisions automatically using GPT-4o.

Built as a production-grade Rails 8 monorepo targeting the [Office Space Software](https://www.officespacesoftware.com) engineering evaluation.

---

## Impact

| Metric | Without VoltDesk AI | With VoltDesk AI |
|--------|---------------------|-------------------|
| Ticket classification | 5–15 min manual | < 3 seconds (GPT-4o) |
| SLA breaches without warning | Frequent | 0% — alert 30 min before |
| Onboarding plan creation | 3–5 days | < 10 seconds (AI-generated) |
| Assets with expired warranty undetected | 10–20% | 0% — alerts at 30/15/7 days |

---

## Live Demo

**Production:** https://voltdesk.app

| Role | Email | Password |
|------|-------|----------|
| Workspace Admin | admin@voltdesk.ai | Password123x |
| Agent | agent@voltdesk.ai | Password123x |
| HR Manager | hr@voltdesk.ai | Password123x |
| IT Manager | it@voltdesk.ai | Password123x |
| Employee | employee@voltdesk.ai | Password123x |

> **QR Demo Mode:** Sign in as `admin@voltdesk.ai` → Admin → Activate Demo Mode → scan the QR code from any mobile device to create tickets live.

> The `guest` role is activated exclusively via QR Demo Mode — no persistent account required.

---

## Architecture

┌─────────────────────────────────────────────────────────────┐
│                     MONOREPO: voltdesk-ai                  │
│                                                             │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │   Rails 8       │        │   React 19 + TypeScript     │ │
│  │                 │        │                             │ │
│  │  Controllers    │◄──────►│  Inertia Pages              │ │
│  │  Service Objs   │  Props │  Components                 │ │
│  │  Pundit Policies│        │  Hooks                      │ │
│  │  ActiveRecord   │        │  Zustand Store              │ │
│  └────────┬────────┘        └─────────────────────────────┘ │
│           │                                                 │
│  ┌────────▼────────┐  ┌──────────┐  ┌──────────────────────┐│
│  │ PostgreSQL 16   │  │ Redis 7  │  │ Sidekiq 7            ││
│  │ + pgvector HNSW │  │          │  │ AI Processing        ││
│  │ RAG · 1536-dim  │  │ Cache    │  │ Background Jobs      ││
│  └─────────────────┘  │ Pub/Sub  │  └──────────────────────┘│
│                        └──────────┘                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Layer: GPT-4o · Claude Sonnet · Gemini Flash       │ │
│  │  text-embedding-3-large · pgvector HNSW                │ │
│  │  Classification · RAG · XAI · AiAuditLog · ModelRouter │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

---

## Local Setup

```bash
git clone https://github.com/josemarioarias12/voltdesk-ai.git
cd voltdesk-ai
cp .env.example .env       # Add OPENAI_API_KEY and GOOGLE_CLIENT_ID
docker-compose up          # Starts Rails + PostgreSQL + Redis + Sidekiq
```

Open [http://localhost:3000](http://localhost:3000) — running in under 5 minutes.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend | Rails 8 (monorepo) | Backend and frontend in one repo via Inertia — no CORS, no JWT, no separate API |
| ORM | ActiveRecord + pgvector | All data in one PostgreSQL instance; `neighbor` integrates vector search natively |
| Bridge | Inertia.js | Rails renders props directly into React — no `fetch`, no Apollo, no serialization layer |
| Frontend | React 19 + TypeScript strict | `any` forbidden; all errors caught at compile time |
| UI | TailwindCSS v4 + shadcn/ui | Accessible Radix UI components; zero custom CSS |
| AI | GPT-4o + text-embedding-3-large | Classification, RAG, XAI, onboarding, executive reports |
| Vector Search | pgvector HNSW | 98%+ recall in the same PostgreSQL — eliminates Pinecone ($70+/mo) |
| Jobs | Sidekiq 7 + Redis 7 | All AI processing is asynchronous; users never wait on OpenAI |
| Auth | Devise + Google OAuth2 | Corporate SSO with native Rails session — no token refresh complexity |
| Authorization | Pundit | Per-resource policies; fully testable; enforced multi-tenant isolation |
| Voice | Web Speech API | Browser-native, $0, audio never leaves the user's device |
| Rate Limiting | Rack::Attack | 60 req/min per user, 20 AI calls/min per workspace, 10 login attempts/min per IP |
| AI Models | GPT-4o · Claude Sonnet · Gemini Flash | Multi-provider via `Ai::ModelRouter`; per-workspace routing with automatic fallback chain |
| Embeddings | text-embedding-3-large (OpenAI) | 1536-dim vectors; pgvector requires fixed dimensions — embeddings always via OpenAI |
| AI Audit | AiAuditLog (mandatory) | Every AI call logged: prompt, response, tokens, latency, confidence, provider |
| Real-time | ActionCable (WebSockets) | Live ticket updates, SLA alerts, notification badges — no polling |
| Background Scheduler | Sidekiq Cron | WarrantyAlertJob daily 8am, ExecutiveReportJob every Monday 7am |
| Rate Limiting | Rack::Attack | 60 req/min per user, 20 AI calls/min per workspace |

---

## Key Technical Decisions

**Monorepo over 3 repositories**
Single `git clone`, single CI/CD pipeline, single deploy. No CORS configuration, no JWT management, no cross-repo coordination overhead.

**pgvector over Pinecone**
Runs inside the existing PostgreSQL instance at zero additional cost. HNSW index delivers 98%+ recall — comparable to dedicated vector databases.

**Web Speech API over Whisper**
Audio is processed entirely on the user's device and never transmitted to any server. Zero cost, zero system dependencies, works offline.

**Inertia.js over REST API + SPA**
Rails sends typed props directly to React components. Eliminates the entire API serialization layer, client-side fetching, and token-based authentication.

**Multi-provider AI architecture over single-vendor lock-in**
`Ai::ModelRouter` routes each operation to the configured provider per workspace — OpenAI GPT-4o, Anthropic Claude Sonnet, or Google Gemini Flash. Each provider implements a unified adapter interface. Embeddings always use OpenAI `text-embedding-3-large` since pgvector requires fixed 1536-dim vectors incompatible with Gemini (768d) and Anthropic (no embeddings API).

---

## Modules

| # | Module | Highlights |
|---|--------|------------|
| 1 | Smart Ticket Engine | Atomic TK-NNNNN sequence, auto SLA, load-based assignment, state machine |
| 2 | AI Engine | GPT-4o classification in <3s, RAG with citations, XAI panel, full AiAuditLog, multi-provider routing, automatic fallback on failure |
| 3 | Auth + Multi-tenancy | Google OAuth, isolated workspaces, 9 roles, Pundit per-resource policies |
| 4 | Voice-to-Ticket | Web Speech API, real-time transcript, same classification pipeline |
| 5 | QR Demo Mode | Redis token, 30-min TTL, max 50 concurrent guests, auto-expiry, Redis INCR counter, middleware auto-invalidation |
| 6 | HR Operations | Leave request approval flow, AI onboarding plans by role |
| 7 | IT Asset Management | Inventory lifecycle, AI risk scoring, warranty alerts at 30/15/7 days |
| 8 | Analytics Dashboards | Role-specific views: Employee, Manager (heatmap), Executive (KPIs) |
| 9 | Notification Center | ActionCable real-time, badge count, mark read individually or all |
| 10 | Admin Control Center | Tenant management, AI Audit Log viewer, cost tracking by workspace |

---

## Quality

```bash
bundle exec rspec          # 622 examples, 0 failures
npx tsc --noEmit           # 0 TypeScript errors
bundle exec rubocop        # 0 offenses
rails demo:verify          # 54/54 checks ✅
```

## Performance

See [PERFORMANCE.md](PERFORMANCE.md) for full benchmarks.

| Metric | Result | Target |
|--------|--------|--------|
| p95 query time | < 57ms | < 200ms ✅ |
| Bundle size (gzip) | ~270kb | < 500kb ✅ |
| pgvector similarity search | < 50ms | < 50ms ✅ |
| db:seed time | ~37s | < 5min ✅ |
| GET /health | 200 OK | Railway healthcheck ✅ |

---

## Demo Data 

| Entity | Count |
|--------|-------|
| Workspaces | 6 (5 industry + 1 DEMO) |
| Users | 60 (all roles per workspace) |
| Tickets | 575 (60 days historical) |
| IT Assets | 51 |
| AiAuditLog entries | 540 |
| ComplianceLogs | 362 |
| ApiRequests | 820 |
| PatternAlerts | 8 active |
| AgentActions | 6 pending approval |

### Demo Credentials

All passwords: `Password123x` — DEMO workspace: `DemoPass2024!`

| Workspace | Scenario | Admin Email |
|-----------|----------|-------------|
| TechCorp Inc | DB outage crisis — SLA breach in 25min | admin@techcorp.voltdesk.ai |
| HealthCo Medical | Medical equipment offline + sentiment drop | admin@healthco.voltdesk.ai |
| RetailPlus | POS spike — 8 stores down + anomaly Z-score 3.8 | admin@retailplus.voltdesk.ai |
| StartupAI | AI confidence < 0.70 on 30% of tickets | admin@startupai.voltdesk.ai |
| ConsultingPro | SOC 2 audit + GDPR purge logs | admin@consultingpro.voltdesk.ai |
| VoltDesk Demo | All modules in 5 min — QR Demo Mode | demo_admin@voltdesk.ai |

### Demo Verification

```bash
rails demo:verify           # 54/54 checks across all workspaces
rails demo:generate_embeddings  # pgvector HNSW embeddings (real or synthetic)
```

## Branch Strategy

| Branch | Purpose | CI |
|--------|---------|----|
| `dev01` | Active development | rubocop + tsc + rspec on every push |
| `qa` | Staging / integration | CI + auto-deploy to Railway |
| `main` | Production | CI + production deploy |

---

*VoltDesk AI · [github.com/josemarioarias12/voltdesk-ai](https://github.com/josemarioarias12/voltdesk-ai)*