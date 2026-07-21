# VoltDesk AI — Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately to the maintainers.
Do NOT open a public GitHub issue for security vulnerabilities.

**Contact:** security@voltdesk.ai
**Response SLA:** 48 hours for acknowledgment, 7 days for remediation plan.

---

## Security Audit Command

```bash
bundle exec rake security:audit
```

This runs: Brakeman static analysis + bundle-audit dependency check + workspace isolation specs + rate limiting specs.

---

## Secret Rotation Policy

- All API keys must be rotated immediately upon suspected compromise via `ApiKey#revoke!`
- Rails credentials (`config/master.key`) rotated per environment on any team member offboarding
- Google OAuth2 client secret rotated annually or on suspected compromise
- Database passwords rotated via Railway environment variables — no downtime required

---

## OWASP Top 10 — Verified Status (Sprint 19)

| # | Risk | Status | Evidence |
|---|------|--------|----------|
| A01 | Broken Access Control | ✓ Mitigated | Pundit policies on every controller action. `policy_scope` on all index queries. workspace scoping via `current_workspace`. workspace_isolation_spec.rb covers 10 scenarios. |
| A02 | Cryptographic Failures | ✓ Mitigated | `force_ssl = true` in production. Session `secure: true, httponly: true`. ApiKey stored as SHA256 digest only — plaintext never persisted. `secure_compare` prevents timing attacks. |
| A03 | Injection | ✓ Mitigated | ActiveRecord parameterized queries throughout. `Arel.sql()` only for static SQL expressions with internal values. 0 string interpolations with user input in where/order/select. Brakeman: 0 warnings. |
| A04 | Insecure Design | ✓ Mitigated | Multi-tenant isolation enforced at DB query level (not just UI). Service objects encapsulate business logic. Invite-only registration — no public signup attack surface. |
| A05 | Security Misconfiguration | ✓ Mitigated | CSP nonce-based headers active. Secure headers via ApplicationController. Sidekiq Web UI protected by Devise authentication + role constraint. No default credentials. |
| A06 | Vulnerable Components | ✓ Mitigated | bundle-audit: 0 vulnerabilities. net-imap updated to 0.6.4.1 (CVE-2026-47240/41/42). oauth2 updated to 2.0.23 (GHSA-pp92-crg2-gfv9 — bearer token leak). |
| A07 | Auth & Session Failures | ✓ Mitigated | Devise with Google OAuth2. Session expires after 8 hours. Cookie: httponly, secure, SameSite=Lax. Rack::Attack throttles login attempts (10/min per IP). Revoked tokens return 401 immediately. |
| A08 | Software & Data Integrity | ✓ Mitigated | Bundler.require with lockfile. No `eval` of user input. AI responses parsed via JSON.parse after stripping markdown — no eval. |
| A09 | Logging & Monitoring | ✓ Mitigated | AiAuditLog records every AI call with prompt/response/tokens/latency. ApiRequest append-only log per API key. ComplianceLog for GDPR events. Rack::Attack logs throttled requests. |
| A10 | SSRF | ✓ Mitigated | Webhook delivery via `Webhooks::DeliverJob` — URL validated at creation. No user-controlled URLs fetched server-side outside of webhook context. |

---

## Vulnerabilities Found and Fixed — Sprint 19

| CVE / Advisory | Gem | Severity | Fix Applied |
|----------------|-----|----------|-------------|
| CVE-2026-47240 | net-imap 0.6.4 | Medium | Updated to 0.6.4.1 |
| CVE-2026-47241 | net-imap 0.6.4 | Low | Updated to 0.6.4.1 |
| CVE-2026-47242 | net-imap 0.6.4 | Medium | Updated to 0.6.4.1 |
| GHSA-pp92-crg2-gfv9 | oauth2 2.0.20 | High | Updated to 2.0.23 |

### Code Changes — Sprint 19

- `app/services/analytics/ai_health_metrics.rb` — Wrapped `having()` in `Arel.sql()` to eliminate Brakeman SQL injection false positive
- `app/models/api_key.rb` — `authenticate` uses `ActiveSupport::SecurityUtils.secure_compare` to prevent timing attacks
- `app/controllers/concerns/api_key_authenticatable.rb` — Added `enforce_scope!` method for per-action scope enforcement
- `app/controllers/api/v1/tickets_controller.rb` — `before_action enforce_scope!` for `tickets:read` and `tickets:create`
- `app/controllers/api/v1/assets_controller.rb` — `before_action enforce_scope!` for `assets:read`
- `app/controllers/application_controller.rb` — Generic 404 handler (no ID/model exposure). CSP nonce shared via Inertia. `SecureHeaders` included.
- `app/controllers/api/v1/base_controller.rb` — Generic 404 message for API (no ActiveRecord message exposure)
- `config/initializers/content_security_policy.rb` — Nonce-based CSP. Report-only in development. Enforced in production.
- `config/initializers/secure_headers.rb` — X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- `config/environments/production.rb` — `ssl_options` with 301 redirect. Session store with httponly/secure/SameSite/8h expiry.
- `.brakeman.ignore` — 1 documented false positive (DDL CREATE SEQUENCE with internal integer ID)
