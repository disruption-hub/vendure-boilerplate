# NestJS Migration – Phase 0 Discovery Report

## 1. Objectives & Scope Confirmation

- Establish a complete inventory of server-side entry points and shared utilities that must be migrated from the Next.js monolith to the future NestJS backend.
- Catalog configuration and environment dependencies to prevent surprises during extraction.
- Produce artifacts that future phases (workspace bootstrap, auth migration, etc.) can reference without re-discovery.

## 2. API Route Inventory

Automated traversal identified **136** Next.js route handlers under `src/app/api/**`. Counts by top-level domain:

| Domain                                | Count |
|---------------------------------------|-------|
| `(admin)`                             | 53    |
| `whatsapp`                            | 17    |
| `(auth)`                              | 8     |
| `chat`                                | 8     |
| `crm`                                 | 7     |
| `(memory)`                            | 7     |
| `(payments)`                          | 5     |
| `(public)`                            | 5     |
| `(chatbot)` (Next app routes)         | 12    |
| `chatbot` (non-parenthesized legacy)  | 2     |
| `(applications)`                      | 1     |
| `(internal)`                          | 1     |
| `(notifications)`                     | 1     |
| `(search)`                            | 1     |
| `(tenant)`                            | 1     |
| `(user)`                              | 2     |
| `(video)`                             | 1     |
| `access-request`                      | 1     |
| `realtime`                            | 1     |
| `tenants`                             | 1     |
| `test-soketi`                         | 1     |

> 📌 A full path list is available via `python3` inventory script (`docs/scripts/nest-inventory.py` placeholder recommended in Phase 1).

### High-Risk Clusters

- **Realtime & Chat**: `/chat/realtime/*`, `/chat/user-threads/*`, `(chatbot)/tenant-chatbot/*` – tightly coupled with Soketi and Zustand chat auth store.
- **WhatsApp**: `/whatsapp/**` – session lifecycle, analytics, media proxying, Baileys worker integration.
- **Admin System Config**: `(admin)/admin/system/*` – manipulates Brevo, LabsMobile, VAPID, OpenRouter, Soketi configs with cache layers.
- **Payments**: `(payments)/payments/lyra/**` and `(admin)/admin/payments/**` – webhook-sensitive.

## 3. Shared Server-Side Modules & Utilities

Key directories whose contents are consumed by both APIs and React components:

- `src/lib/prisma.ts`: Prisma singleton used across handlers.
- `src/lib/realtime/soketi.ts`: Soketi config cache, authorizer, broadcasting helpers.
- `src/lib/services/admin/system-config-service.ts`: Centralized access to Brevo, LabsMobile, OpenRouter, VAPID, Soketi, root-domain configuration with in-memory caches.
- `src/lib/chatbot/**`: Thread utilities, message adapters, contact management, schedule presets, embeddings helpers.
- `src/modules/chatbot/**`: OTP request/verify, session sync, profile management shared with Zustand store.
- `src/stores/chat-auth-store.ts`: Zustand store mixing client state with server API calls (loadSession, logout, etc.).
- `src/lib/whatsapp/**`: Message handler, contact sync, Soketi emitter, cache layers; deeply intertwined with Baileys worker logic.
- `src/lib/services/**`: Abstractions for admin, agent, analytics, configuration, search – ideal seeds for Nest modules.
- `scripts/**`: DevOps and data scripts (`deploy-vercel.js`, `diagnose-soketi-ws.ts`, etc.) assuming monolithic Next runtime.

## 4. Environment & Configuration Baseline

### Environment Variable Families (names only)

- **Database**: `DATABASE_URL`, `DATABASE_PUBLIC_URL`, `PG*`, `POSTGRES_*`, `PGDATA` (Prisma + direct Postgres access).
- **Auth**: `NEXTAUTH_URL`, `NEXTAUTH_SECRET` (will transition to Nest-managed secret); OTP flows rely on API keys configured via system-config service.
- **Realtime / Soketi**: `SOKETI_DEFAULT_APP_ID`, `SOKETI_DEFAULT_APP_KEY`, `SOKETI_DEFAULT_APP_SECRET`, `SOKETI_PUBLIC_HOST`, `SOKETI_PUBLIC_PORT`, `SOKETI_PUSHER_CLUSTER`.
- **Messaging Providers**: Brevo (`BREVO_*` stored in DB configs), LabsMobile (`LABSMOBILE_*` via configs), OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`).
- **Payments**: Lyra/MicuentaWeb credentials pulled from config service and deployment secrets.
- **Deployment**: `RAILWAY_DEPLOYMENT_DRAINING_SECONDS`, `SSL_CERT_DAYS`, Next/Vercel-specific toggles, feature flags in `.env.*` files.

> 🔐 **Action**: rotate exposed secrets from `.env` before publicizing migration artifacts.

### Config Storage via Prisma (Non-env)

- System config table accessed by `system-config-service` storing JSON blobs for Brevo, LabsMobile, OpenRouter, Soketi, VAPID, root domain.
- Per-tenant settings (`Tenant.settings`, `Tenant.chatbotConfig`, etc.) consumed by API routes.

## 5. Testing & QA Baseline

- Existing scripts: `npm run lint` (currently failing due to ESLint config loop), `vitest` (`test:chatbot`), various Playwright suites under `playwright-tests/`.
- Manual testing is heavily documented in Markdown guides (`REALTIME_CONTEXT_GUIDE.md`, `SOKETI_TESTING_GUIDE.md`, etc.). These should be converted into acceptance criteria for each migration phase.

## 6. Phase 0 Deliverables Summary

- ✅ Route handler inventory (counts + highlighted clusters).
- ✅ Shared module catalog for dependency planning.
- ✅ Environment/configuration baseline (env families + Prisma-stored configs).
- ⚠️ Identified need for secret rotation due to plaintext `.env` values.
- 📌 Recommendation to create automation scripts (inventory, dependency graph) as part of Phase 1 setup.

## 7. Recommended Follow-Up Actions

1. **Create Migration Tracker**: Spreadsheet/Jira board seeded with the 136 route handlers, ownership, and planned Nest module destination.
2. **Secret Rotation**: Rotate exposed database and API secrets; store securely (e.g., Railway/Vercel secrets, Vault).
3. **Testing Remediation**: Fix ESLint configuration loop to restore linting prior to phase-by-phase migration.
4. **Bootstrap Workspace (Phase 1)**: Initialize NestJS repo/monorepo, set up shared package skeleton, and wire Prisma client.

This report concludes Phase 0 discovery and sets the groundwork for executing Phase 1 of the migration plan.
