VoltDesk AI

Enterprise Operational Intelligence Platform — Multi-tenant SaaS with native AI.

VoltDesk AI eliminates operational overhead for medium and large enterprises. It unifies support ticketing, HR operations, IT asset management, and workplace analytics under a single system that doesn't just record — it classifies, prioritizes, and converts information into actionable decisions automatically, powered by a multi-provider AI layer (GPT-4o, Claude Sonnet, Gemini Flash), an embedded AI workspace assistant, live 3D facilities management, and hardware-backed biometric authentication.

Built as a production-grade Rails 8 monorepo, developed solo end-to-end as an engineering evaluation artifact for OfficeSpace Software.

Impact
Metric	Without VoltDesk AI	With VoltDesk AI
Ticket classification	5–15 min manual	< 3 seconds (AI)
SLA breaches without warning	Frequent	0% — alert 30 min before
Onboarding plan creation	3–5 days	< 10 seconds (AI-generated)
Assets with expired warranty undetected	10–20%	0% — alerts at 30/15/7 days

Architecture
MONOREPO: voltdesk-ai

Rails 8                          React 19 + TypeScript
- Controllers        <--Props--> - Inertia Pages
- Service Objects                - Components
- Pundit Policies                - Hooks
- ActiveRecord                   - Zustand Store

Data & Jobs layer:
- PostgreSQL 18 + pgvector HNSW  (RAG, 1536-dim embeddings)
- Redis 7                        (cache, pub/sub)
- Sidekiq 7                      (AI processing, background jobs)

AI Layer:
- Models: GPT-4o, Claude Sonnet, Gemini Flash (via Ai::ModelRouter)
- Embeddings: text-embedding-3-large
- Pipeline: Classification, RAG, XAI, AiAuditLog
- Volt Copilot: tool-calling AI workspace assistant
Local Setup
bash
git clone https://github.com/josemarioarias12/voltdesk-ai.git
cd voltdesk-ai
cp .env.example .env       # Add the API keys below
docker-compose up          # Starts Rails + PostgreSQL + Redis + Sidekiq

Required environment variables (full list in .env.example):

Variable	Used for
OPENAI_API_KEY	GPT-4o classification, embeddings
ANTHROPIC_API_KEY	Claude Sonnet routing
GEMINI_API_KEY	Gemini Flash routing
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET	Google OAuth2 sign-in
RESEND_API_KEY	Transactional email

Open http://localhost:3000 — running in under 5 minutes.

Tech Stack
Layer	Technology	Rationale
Backend	Rails 8 (monorepo)	Backend and frontend in one repo via Inertia — no CORS, no JWT, no separate API
ORM	ActiveRecord + pgvector	All data in one PostgreSQL instance; neighbor integrates vector search natively
Bridge	Inertia.js	Rails renders props directly into React — no fetch, no Apollo, no serialization layer
Frontend	React 19 + TypeScript strict	any forbidden; all errors caught at compile time
UI	TailwindCSS v4 + shadcn/ui	Accessible Radix UI components; zero custom CSS
3D	Three.js + React Three Fiber + drei	Live office scene for the Facilities module; real-time multi-user avatar presence over ActionCable
AI Models	GPT-4o · Claude Sonnet · Gemini Flash	Multi-provider via Ai::ModelRouter; per-workspace routing with automatic fallback chain
Embeddings	text-embedding-3-large (OpenAI)	1536-dim vectors; pgvector requires fixed dimensions — embeddings always use OpenAI regardless of which model classified the ticket
Vector Search	pgvector HNSW	98%+ recall in the same PostgreSQL instance — eliminates a dedicated vector database
AI Audit	AiAuditLog (mandatory)	Every AI call logged: prompt, response, tokens, latency, confidence, provider
Jobs	Sidekiq 7 + Redis 7	All AI processing is asynchronous; users never wait on a model provider
Background Scheduler	Sidekiq Cron	e.g. warranty alerts daily 8am, executive report every Monday 7am
Auth	Devise + Google OAuth2 + WebAuthn	Corporate SSO with native Rails session; WebAuthn/Passkeys add Face ID/Touch ID login — the server stores only a public key, never a password or biometric data
Authorization	Pundit	Per-resource policies; fully testable; enforced multi-tenant isolation
Voice	Web Speech API	Browser-native, $0, audio never leaves the user's device
Real-time	ActionCable (WebSockets)	Live ticket updates, SLA alerts, notification badges, 3D avatar presence — no polling
i18n	react-i18next + Rails i18n	Bilingual EN/ES across the platform
Reporting	Prawn + caxlsx	PDF/Excel export for compliance and executive reports
Ops Alerts	Telegram Bot API	Operational alerts routed outside the app
Rate Limiting	Rack::Attack	60 req/min per user, 20 AI calls/min per workspace, 10 login attempts/min per IP
Key Technical Decisions

Monorepo over 3 repositories Single git clone, single CI/CD pipeline, single deploy. No CORS configuration, no JWT management, no cross-repo coordination overhead.

pgvector over a dedicated vector database Runs inside the existing PostgreSQL instance at zero additional cost. HNSW index delivers 98%+ recall — comparable to a dedicated vector database.

Web Speech API over Whisper Audio is processed entirely on the user's device and never transmitted to any server. Zero cost, zero system dependencies, works offline.

Inertia.js over REST API + SPA Rails sends typed props directly to React components. Eliminates the entire API serialization layer, client-side fetching, and token-based authentication.

Multi-provider AI architecture over single-vendor lock-in Ai::ModelRouter routes each operation to the configured provider per workspace — OpenAI GPT-4o, Anthropic Claude Sonnet, or Google Gemini Flash — through a unified adapter interface with automatic fallback on failure.

Tool-calling AI assistant over free-text chat Volt Copilot never answers from memory. Every response invokes a real, Pundit-authorized backend tool that queries live workspace data and returns a ServiceResult. Write actions require explicit user confirmation before executing. This guarantees answers are always grounded in real data, never hallucinated.

WebAuthn/Passkeys over password-only auth The server never stores biometric data or passwords for passkey users — only a public key, useless without the private key that never leaves the device. Signatures are scoped to the exact origin, which eliminates phishing by design.

Modules
#	Module	Highlights
1	Smart Ticket Engine	Atomic TK-NNNNN sequence, auto SLA, load-based assignment, state machine
2	AI Engine	Classification in <3s, RAG with citations, XAI panel, full AiAuditLog, multi-provider routing with automatic fallback
3	Volt Copilot	AI workspace assistant embedded on every screen; tool-calling only — every answer invokes a real, authorized backend tool, never answers from memory; confirm-before-execute on write actions, voice I/O, full audit trace
4	3D Facilities	Live office scene built with Three.js; real-time multi-user avatar presence and capacity-pool space reservations broadcast over ActionCable
5	Auth + Multi-tenancy	Google OAuth + WebAuthn/Passkeys, isolated workspaces, 10 roles, Pundit per-resource policies
6	Voice-to-Ticket	Web Speech API, real-time transcript, same classification pipeline
7	QR Demo Mode	Redis token, 30-min TTL, max 50 concurrent guests, auto-expiry, Redis INCR counter, middleware auto-invalidation
8	HR Operations	Leave request approval flow with cross-department coverage conflict detection, AI onboarding plans by role
9	IT Asset Management	Inventory lifecycle, AI risk scoring, warranty alerts at 30/15/7 days
10	Model Governance	Automated AI provider pricing/deprecation sync with human-in-the-loop approval
11	Compliance & Pattern Alerts	Compliance log built for SOC 2 evidence, anomaly pattern detection, workspace self-learning from agent corrections
12	Analytics Dashboards	Role-specific views: Employee, Manager (heatmap), Executive (KPIs)
13	Notification Center	ActionCable real-time, badge count, mark read individually or all
14	Admin Control Center	Tenant management, AI Audit Log viewer, cost tracking by workspace

Quality
bundle exec rspec          # 1607 examples, 0 failures
npx tsc --noEmit           # 0 errors
bundle exec rubocop        # 512 files inspected, 0 offenses


Performance

See PERFORMANCE.md for full benchmarks.
Metric	Result	Target
p95 query time	< 57ms	< 200ms ✅
Bundle size (gzip)	~270kb	< 500kb ✅
pgvector similarity search	< 50ms	< 50ms ✅
db:seed time	~37s	< 5min ✅
GET /health	200 OK	Railway healthcheck ✅


Branch Strategy
Branch	Purpose	CI
dev01	Active development	rubocop + tsc + rspec on every push
qa	Staging / integration	CI + auto-deploy to Railway
main	Production	CI + production deploy

VoltDesk AI · github.com/josemarioarias12/voltdesk-ai
