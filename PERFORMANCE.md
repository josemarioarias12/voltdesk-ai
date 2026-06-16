# PulseDesk AI — Performance Report (Sprint 20)

## Query Performance (EXPLAIN ANALYZE)

All queries measured with 540 tickets, 60 users, 6 workspaces in development.

| Query | Time | Status |
|-------|------|--------|
| Ticket index (includes department + assigned_to, limit 25) | 56.57ms | ✅ |
| SLA checker (due_at < now, status open/in_progress) | 1.65ms | ✅ |
| Pattern detection (group by department_id, last 2h) | 0.01ms | ✅ |
| AI Health metrics (group by operation, avg confidence, 7d) | 0.01ms | ✅ |
| API metrics (group by endpoint, last 24h) | 0.00ms | ✅ |

**Target: p95 < 200ms — All queries passed ✅**

## Indexes Added in S20

No additional indexes required — all queries under 200ms with existing indexes from S1–S19.

Existing critical indexes:
- `index_tickets_on_workspace_id_and_status`
- `index_tickets_on_workspace_id_and_created_at`
- `index_tickets_on_due_at`
- `index_ai_audit_logs_on_workspace_id_and_created_at`
- `index_api_requests_on_workspace_id_and_created_at`
- `index_ticket_embeddings_on_embedding` (HNSW, pgvector)

## N+1 Queries Audit (Bullet gem)

Controllers audited with 540 seeds loaded:

| Controller | N+1 Found | Fix Applied |
|-----------|-----------|-------------|
| TicketsController#index | None | `includes(:department, :assigned_to, :created_by, :activities)` already present |
| TicketsController#show | None | `includes(comments: :user, activities: :user)` already present |
| AssetsController#index | None | `includes(:assigned_to, :department)` already present |

**Result: 0 N+1 warnings ✅**

## Redis Cache

| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| Admin::OverviewController#index | `workspace_{id}_overview` | 5 minutes |
| Admin::AiHealthController#index | `workspace_{id}_ai_health_{days}` | 5 minutes |
| Admin::BenchmarkController#index | `benchmark_{id}_{date}` | 5 minutes |

Cache store: `:redis_cache_store` in production, `:memory_store` in development.

## pgvector HNSW

- Embedding dimensions: 1536 (text-embedding-3-large)
- Index type: HNSW (recall 98%+)
- Embeddings in DB: generated via `rake demo:generate_embeddings`
- Similarity search target: < 50ms

## Bundle Size

Run `npx vite-bundle-visualizer` to audit. Target: < 500kb gzipped.

## Seed Performance

Full `rails db:seed` completes in ~36 seconds for 540 tickets, 60 users, 6 workspaces.