## Executive Summary

- **Objective**: Extract the extensive server-side surface area currently implemented as Next.js Route Handlers into a standalone NestJS backend while preserving all product capabilities (admin dashboard, chatbot, WhatsApp orchestration, CRM, payments, memory engine, etc.).
- **Current Footprint**: ~120 API route handlers across `src/app/api`, a 1,500+ line Prisma schema, real-time messaging via Soketi/Pusher, and deep coupling with shared libraries in `src/lib`, `src/modules/chatbot`, and state stores. The existing codebase also includes a dormant `/services` folder outlining microservice aspirations.
- **Complexity Assessment**: **Very High**. The back-end logic is tightly co-located with React components, and multiple authentication paths (NextAuth admin + phone OTP chatbot) run through shared stores. Expect a multi-month effort with staged migration, heavy regression testing, and a period of dual-running both stacks.
- **Recommended Strategy**: Build an incremental migration that starts by establishing a NestJS monorepo package, introduces shared libraries for Prisma/domain types, and rehomes functionality module-by-module (Auth → Tenant → Admin → Chat/Realtime → WhatsApp → Payments → Search/Memory). Maintain compatibility via a versioned API layer and feature flags until the Next API surface can be retired.

---

## Current State Analysis

### Repository Structure Highlights

- `src/app/(...)`: Next.js App Router with co-mingled server components and API route handlers (admin, chatbot, whatsapp, CRM, payments, memory, etc.).
- `src/lib`: Shared utilities (Prisma client, realtime/Soketi helpers, chatbot logic, service facades, analytics, payment adapters, AI utilities). Many server-only functions are imported directly by React components.
- `src/modules/chatbot`: Domain-specific logic (OTP flows, chat auth client/server, message adapters) that is reused both in the front-end and Route Handlers.
- `prisma/`: Large relational schema supporting tenants, users, chatbot interactions, WhatsApp messages, CRM entities, payments, scheduling, vector search, etc.
- `services/`: Conceptual microservice folders (admin-service, agent-service, api-gateway, etc.) but currently unused—indicative of desired future separation.
- `scripts/`: Operational scripts (deploy, Soketi diagnostics, data imports) that assume a monolithic Next.js deployment with embedded APIs.

### Back-End Surface Area

- **API Route Handlers**: ~120 `route.ts` files under `src/app/api`. Key clusters:
  - `(admin)/admin/*`: Tenant management, communications, scheduling, system config, payments, analytics.
  - `whatsapp/*`: Session lifecycle, media handling, message dispatch, analytics.
  - `chat/*` & `(chatbot)/*`: Thread management, realtime auth/config, scheduled messages, streaming chat endpoints.
  - `(auth)/*`: Credentials login (NextAuth), phone-based OTP flows, profile sync.
  - `(memory)/*`: Knowledge base ingestion, cleanup, stats.
  - `(payments)/*`: Lyra payment links, webhooks, success/failure handling.
  - `(notifications)/*`: Push notification registration.
  - `crm/*`: Ticketing, customer CRUD, draft handling.
  - `realtime/config|auth`: Soketi configuration and authorization endpoints (interacting with NextAuth + chat auth store).
- **Realtime**: `src/contexts/RealtimeContext.tsx` (client) + `src/lib/realtime/soketi.ts` (server). Uses Soketi/Pusher with custom authorizers, caching via `system-config-service`, and store-driven session refresh.
- **Authentication**:
  - Admin: NextAuth with Prisma adapter (`src/lib/auth.ts`, credential provider).
  - Chatbot: Phone OTP via `src/modules/chatbot/client/server` APIs and Zustand store (`src/stores/chat-auth-store.ts`).
  - Shared context endpoint `src/app/api/chat/shared-auth.ts` merges NextAuth session and chatbot token validation.
- **Data Access**: Prisma used everywhere. Many route handlers import `prisma` directly from `src/lib/prisma.ts`. Some APIs use transactional flows, caching layers, and custom data mappers.
- **External Integrations**: Baileys WhatsApp, Soketi, Brevo, LabsMobile, Lyra payments, OpenRouter, Meilisearch, vector DB. Configuration stored via Prisma-backed key-value tables accessed through `system-config-service`.
- **Shared Types & Utilities**: Heavily reused across frontend and backend (e.g., `src/lib/chatbot/user-thread-utils`, `src/lib/whatsapp`, `src/lib/services`). Untangling these will require systematic extraction into an isomorphic package or duplicating DTOs.

### Deployment & Tooling Coupling

- Single Next.js project handles SSR, SPA routes, and APIs. Environment variables for database, Soketi, payments, etc., are loaded directly into the Next runtime.
- Build scripts (`package.json`) run Prisma migrations before `next build`. Any NestJS extraction must maintain Prisma migration ownership or move it to the backend.
- Realtime authentication currently depends on cookies (`NextAuth`) and Zustand state for phone auth; front-end components expect WebSocket authorizers provided by the Next API (`/api/chat/realtime/auth`).
- DevOps artifacts (Dockerfiles, Railway/Vercel scripts) assume the monolith. Extracting the backend means new CI/CD pipelines, container definitions, and secrets management.

---

## Target NestJS Architecture Recommendation

### High-Level Modules

- **Core**: Configuration, environment management, logging, exception filters, caching (Redis or in-memory replacement for current ad-hoc caches).
- **Auth Module**: Credential login (migrate from NextAuth to Nest Passport strategies), session issuance (JWT), phone OTP flows (reuse existing `chatbot` module logic). Provide compatibility endpoints for the React/Zustand stores.
- **Tenant Module**: Tenant CRUD, preferences, logo assets, signup requests.
- **User Module**: Admin user management, profile, approvals, role management.
- **Communications Module**: Email/SMS config (Brevo, LabsMobile), template management, scheduling, send endpoints.
- **Chat Module**: Tenant user threads, message CRUD, read receipts, typing, scheduled messages. Wrap Prisma interactions currently in `chat` routes and `lib/chatbot` helpers.
- **Realtime Module**: Pusher/Soketi authorizer, config endpoints, WebSocket gateway (optional) to consolidate event broadcasting.
- **WhatsApp Module**: Sessions, contacts, message ingestion/distribution, media proxying, analytics. Encapsulate Baileys worker orchestration.
- **Payments Module**: Lyra link generation, webhooks, reports, taxes/products management.
- **CRM Module**: Tickets, customers, comments, attachments.
- **Memory/Search Module**: Knowledge base ingestion, vector operations, Meilisearch bridging.
- **Analytics Module**: Aggregate metrics currently served via admin endpoints.

Organize modules in a NestJS monorepo (Nx or standalone) to support future service decomposition. Share DTOs and Prisma models via a `@ipnuo/shared-domain` library.

### Data Layer Strategy

- Continue using Prisma for data access; generate the client in the backend workspace. Expose repositories/services per module to encapsulate queries now scattered across route handlers.
- Create DTOs and mappers to isolate database shapes from API responses—this will simplify future externalization.
- Audit the 1500+ line schema to confirm compatibility with NestJS Prisma. Some enums/types may need extraction into dedicated files.

### Authentication & Session Bridging

- Replace NextAuth credential provider with NestJS Passport strategy (`@nestjs/passport`, `passport-local`). Issue JWT or session cookies consumable by the Next front-end.
- Port phone OTP flow by reusing `chatbot` domain services (request, verify, sync, profile). Provide Nest endpoints with identical payload contracts to minimize front-end changes.
- Implement a token introspection endpoint so the Next app can validate existing sessions during migration.

### Realtime Integration

- Abstract Soketi/Pusher logic into a Nest service that:
  - Manages configuration caching (currently in `system-config-service`).
  - Generates auth signatures for private/presence channels.
  - Broadcasts WhatsApp and chat events (currently handled in multiple helpers).
- Expose the same `/realtime/auth` and `/realtime/config` endpoints initially, then transition the front-end to a new base URL once stable.

### External Integrations

- **Baileys Worker**: Evaluate moving worker orchestration into Nest (possibly as a separate microservice) or keeping the existing worker script but pointing it at the Nest API for persistence.
- **Payments (Lyra)**: Recreate webhook endpoints with Nest controllers and ensure idempotency/hmac validation logic is preserved.
- **Email/SMS Providers**: Migrate configuration caches and senders into Nest injectable services.
- **Meilisearch & Vector DB**: Port ingestion scripts or expose them via Nest CLI commands.

---

## Migration Plan (Hyper-Detailed)

### Phase 0 – Discovery & Alignment (1–2 weeks)

1. **Stakeholder Alignment**: Confirm scope (full backend extraction versus selective modules), target hosting (e.g., Railway for Nest), and success metrics.
2. **Codebase Audit Deliverables**:
   - Inventory spreadsheet of every `src/app/api/**/route.ts` with owner/team, dependencies, and migration priority.
   - Map shared utilities in `src/lib` to future Nest modules.
   - Identify front-end components importing server-only modules (must be refactored).
3. **Environment Baseline**: Document all required env vars from `.env*`, `system-config-service`, and script defaults.
4. **Testing Baseline**: Ensure automated tests exist or define regression suites (Playwright, Vitest, manual checklists).

### Phase 1 – NestJS Workspace Bootstrap (1 week)

1. Create `backend/` directory (or separate repo) initialized with NestJS (prefer Nx for shared libs).
2. Configure TypeScript paths to share schemas/types (possibly via `packages/shared`).
3. Add Prisma schema to the new workspace; set up `prisma generate` and migration scripts.
4. Introduce core Nest infrastructure (logging, config module, validation pipe, exception filters, Prisma service, health checks).
5. Set up CI/CD skeleton (lint/test/build docker) and deployment target (Dockerfile + Railway/Vercel/Render environment).

### Phase 2 – Shared Libraries & Domain Models (1–2 weeks)

1. Extract pure TypeScript models/utilities from `src/lib/**/*.ts` into shared packages (`@ipnuo/domain`, `@ipnuo/utils`). Prioritize code with minimal React coupling.
2. Define DTOs/interfaces for Tenants, Users, Chat Threads, WhatsApp sessions, etc., aligning with Prisma types.
3. Establish `@ipnuo/prisma` Nest library to encapsulate database client with connection pooling, logging, and transactional helpers.
4. Build a compatibility layer for constants/enums (e.g., `ChatbotContactType`, `TenantApprovalStatus`).

### Phase 3 – Authentication & Identity (2–3 weeks)

1. Reimplement credential login in Nest (Local strategy + JWT). Provide `/auth/login`, `/auth/logout`, `/auth/profile` endpoints.
2. Migrate phone OTP flows:
   - Endpoints: `/auth/phone/request`, `/auth/phone/verify`, `/auth/phone/session`, `/auth/phone/profile`, `/auth/phone/sync`.
   - Reuse `modules/chatbot` logic for normalization, tenant gating, error codes.
3. Implement token validation endpoint consumed by front-end to maintain session continuity.
4. Update Next.js front-end to optionally target Nest endpoints via environment flag, but keep NextAuth as fallback until rollout.

### Phase 4 – Core Tenant & Admin APIs (3–4 weeks)

1. Port tenant CRUD, preferences, logo upload, department/user management.
2. Recreate communications configuration endpoints (Brevo, LabsMobile, VAPID, root domain, OpenRouter, Soketi), including caching semantics.
3. Implement analytics endpoints (`admin/stats`, communications dashboards) with Nest controllers/services.
4. Provide file upload handling (logo assets) via Nest `@nestjs/platform-express` or dedicated file service.
5. Validate admin front-end flows by switching API base URLs module-by-module.

### Phase 5 – Chat & Realtime (4–5 weeks)

1. Migrate chat thread CRUD, message delivery/read endpoints, scheduled messages, and streaming endpoints (potentially via Nest + SSE or websockets).
2. Recreate `/chat/realtime/config` and `/chat/realtime/auth` inside Nest, ensuring compatibility with RealtimeProvider.
3. Implement a Nest service for Soketi interactions (authorization, broadcasting). Ensure caching and debug logging match current behavior.
4. Update front-end RealtimeProvider to fetch config/auth from Nest base URL (feature-flagged).
5. Ensure Zustand store (`chat-auth-store`) interacts with Nest endpoints without behavior regressions.

### Phase 6 – WhatsApp Integration (4–6 weeks)

1. Port WhatsApp session endpoints (connect, disconnect, health, status, sessions list) and ensure encryption/credential management remains secure.
2. Migrate media proxy routes, contact linking, analytics, message history, and send/send-media endpoints.
3. Refactor Baileys worker scripts to target Nest APIs for message persistence and event broadcasting. Consider embedding the worker inside Nest as a background service.
4. Recreate broadcast emitter (`broadcastWhatsAppEvent`) within Nest, consolidating logging and error handling.
5. Run comprehensive integration tests with Sandbox WhatsApp accounts before switching production traffic.

### Phase 7 – Payments, CRM, Memory/Search (6–8 weeks)

1. Payments: Rebuild Lyra endpoints (link creation, webhooks, product/tax CRUD) and validation logic. Ensure webhook signature verification is migrated.
2. CRM: Tickets, customers, comments, attachments endpoints moved into Nest modules with transactional safety.
3. Memory/Search: Move ingestion endpoints, stats, cleanup tasks. Provide CLI commands for batch imports if needed.
4. Notifications: Recreate push notification registration endpoints and ensure VAPID keys align.
5. Validate dependent admin UI flows after each sub-module switchover.

### Phase 8 – Front-End Refactor & Decommission (3–4 weeks)

1. Update Next.js API fetchers/hooks to point to Nest base URLs. Remove server-side Prisma usage from React components (force them to call Nor new backend).
2. Delete or stub Next API route files that have been superseded, reducing risk of accidental use.
3. Update infrastructure scripts (`deploy-vercel.js`, Railway configs) to provision separate services.
4. Perform load/performance testing on Nest backend; ensure horizontal scaling strategies exist.
5. Finalize documentation, handover runbooks, and incident response updates.

### Phase 9 – Post-Migration Hardening (ongoing)

1. Monitor logs/metrics for regression.
2. Incrementally refactor Nest modules into microservices if needed (leveraging the existing `/services` plan).
3. Clean up deprecated utilities in `src/lib` once front-end no longer depends on them.

---

## Risk & Impact Assessment

- **Tight Coupling**: Many React components import helpers that use Prisma directly. Each occurrence must be refactored into API calls or client-side adapters.
- **Authentication Shift**: Moving away from NextAuth requires rewriting session handling, email/password flows, and ensuring SSO (if any) still functions.
- **Realtime Dependencies**: Soketi authorization currently mixes NextAuth cookies and chatbot bearer tokens. Nest must replicate this dual-mode logic without breaking RealtimeProvider.
- **External Providers**: Payments, WhatsApp, and communications integrations rely on precise payloads. Regression risk is high without exhaustive integration testing.
- **Operational Overhead**: Two deployable artifacts (Next front-end + Nest backend) demand new CI pipelines, observability, and secret management.
- **Timeline**: Full migration could span 4–6 months with a dedicated team, assuming parallel workstreams and thorough QA.

---

## Immediate Next Steps & Recommendations

1. **Form Migration Squad**: Assign leads for Auth, Chat/Realtime, WhatsApp, Payments, and Platform (DevOps/Tooling).
2. **Build Inventory Tracker**: Create a spreadsheet/Jira epic for every API route with status (Not Started → In Progress → Blocked → Ready → Cutover).
3. **Front-End Abstraction Layer**: Introduce a fetch client in the Next app that points to either `/api` (Next) or the Nest base URL via configuration, simplifying cutover toggles.
4. **Shared Package Setup**: Begin extracting pure TypeScript utilities into `/packages/shared` to minimize duplication.
5. **Design Auth Transition**: Decide whether to keep NextAuth temporarily (using Nest as custom provider) or fully replace with Nest Passport. Prototype this early to de-risk user login flows.
6. **Plan Data Migration Ownership**: Determine which project will own Prisma migrations post-split; consider moving migration files into the Nest workspace while keeping read-only access from Next.

---

## Complexity Summary by Domain

| Domain                          | Complexity | Notes |
|---------------------------------|------------|-------|
| Authentication & Sessions       | High       | Dual-mode auth (NextAuth + Chatbot), shared stores, cookie vs bearer token handling. |
| Tenant & Admin Management       | Medium     | Extensive but straightforward CRUD with Prisma, heavy caching in config service. |
| Communications Templates/Config | Medium     | Relies on cached configs, template rendering, scheduled sends. |
| Chat Threads & Realtime         | Very High  | Presence channels, Soketi auth, scheduled messages, Zustand interactions. |
| WhatsApp Integration            | Very High  | Baileys worker, media proxying, analytics, contact sync. |
| Payments (Lyra)                 | High       | Webhooks, PCI concerns, link/token flows. |
| CRM (Tickets/Customers)         | Medium     | CRUD with attachments, but fewer external touchpoints. |
| Memory/Search Modules           | Medium     | Batch processing, vector search, ingestion pipelines. |
| Analytics & Reporting           | Medium     | Aggregations across multiple tables; needs performance validation. |
| DevOps/Deployment               | High       | New pipelines, env segregation, zero-downtime migration strategy. |

---

## Deployment Instructions

### Railway Deployment (NestJS Backend)

You are an ops assistant working on the IPNuo repo.
Deploy the NestJS backend to Railway as follows:

1. Ensure the Railway CLI is authenticated (`railway login`) using the provided token.
2. From the repo root run `railway init` and link to the existing project `ipnuo-backend` (create if missing).
3. Set the service to use the `backend` directory:
   `railway service backend` then `railway run npm install` and `railway up --service backend --from backend`.
4. Configure required environment variables (`DATABASE_URL`, `JWT_SECRET`, email/SMS credentials, etc.) matching the current Next.js deployment.
5. After deployment, capture the generated public HTTPS URL and return it for use in `CHAT_AUTH_BASE_URL` / `ADMIN_AUTH_BASE_URL`.

#### Current Deployment Status

- **Project**: `ipnuo-backend`
- **Railway URL**: `https://ipnuo-backend-production.up.railway.app`
- **Status**: Deployed and running

#### Required Environment Variables

Set these variables on your Railway project (same values for preview/prod unless you need staging overrides):

```text
DATABASE_URL=<your-postgresql-connection-string>
NEST_AUTH_SECRET=<your-jwt-secret>
# Or use NEXTAUTH_SECRET as fallback
NEXTAUTH_SECRET=<your-jwt-secret>
AUTH_TOKEN_EXPIRES_IN=1h
PORT=3001
```

#### Vercel Frontend Configuration

After updating, trigger a fresh Vercel deploy so Next.js picks up the new env settings.

Set these variables on your Vercel project:

```text
CHAT_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/phone
NEXT_PUBLIC_CHAT_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/phone
ADMIN_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/admin
NEXT_PUBLIC_ADMIN_AUTH_BASE_URL=https://ipnuo-backend-production.up.railway.app/auth/admin
# Optional rollback flag (omit or keep true to allow Prisma fallback)
ADMIN_AUTH_LEGACY_FALLBACK=true
```

After updating, trigger a fresh Vercel deploy so Next.js picks up the new env settings.

---

## Conclusion

Transitioning to a NestJS backend is feasible but demanding. Success hinges on establishing robust shared libraries, maintaining API compatibility during the cutover, and sequencing migrations to minimize downtime. Begin with foundational infrastructure (auth, core services) before tackling high-complexity domains like realtime chat and WhatsApp orchestration. Expect iterative releases and a staged rollout plan with comprehensive monitoring to ensure the front-end experience remains stable throughout the migration.
