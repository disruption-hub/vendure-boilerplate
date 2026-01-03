# NestJS Migration – Phase 6 WhatsApp Integration

## 1. Current Architecture

- **API Surface**: Routes under `/api/whatsapp/**` handle session lifecycle (connect, disconnect, status), analytics, contacts, message history, media proxying, and message sending.
- **Worker**: Baileys worker scripts (`scripts/baileys-worker.ts`, `src/lib/whatsapp/baileys/message-handler.ts`) manage WebSocket connection, message ingestion, and event broadcasting through Soketi.
- **Shared Utilities**: `src/lib/whatsapp/integration/soketi-emitter.ts`, `group-metadata-cache.ts`, `message-adapter.ts` (recently added), `message-handler.ts` handle persistence and event mapping.
- **Realtime Dependence**: WhatsApp events rely on Soketi channels; front-end components subscribe via RealtimeProvider.

## 2. Migration Objectives

- Transition WhatsApp session/control APIs to Nest, ensuring the worker and front-end continue functioning throughout the migration.
- Centralize event broadcasting and analytics in Nest services while preserving existing message schemas.
- Maintain traceability and error handling as seen in current logging (extensive console tracing in emitters and handlers).

## 3. Staged Migration Plan

### Stage A – Shared Types & Utilities
- Export WhatsApp DTOs (message payloads, session statuses) via `@ipnuo/domain`.
- Port shared adapters (e.g., message normalization) into shared packages or directly into Nest modules (with minimal dependencies).

### Stage B – Nest WhatsApp Module Skeleton
- Create `WhatsappModule` with services for:
  - Session management (create/disconnect, delegate to Prisma).
  - Message persistence and retrieval.
  - Media proxying (stream files via Nest while keeping storage endpoints identical).
  - Analytics queries (reuse Prisma aggregation logic).
- Provide controllers mirroring existing endpoints with identical request/response contracts.

### Stage C – Worker Integration
- Update Baileys worker to call Nest APIs for persistence and event triggers. During transition, keep Next endpoints available as fallback.
- Ensure worker authentication (API keys or service tokens) is handled securely.
- Refactor `soketi-emitter` to use shared Nest service; maintain logging verbosity for debugging.

### Stage D – Feature-Flagged Front-End Cutover
- Introduce flag for WhatsApp API base URL; point admin UI to Nest once endpoints validated.
- Gradually migrate analytics dashboards, contact linking, message views to new backend.
- Validate media download/upload flows in staging, including large files.

### Stage E – Cleanup & Optimization
- Once stable, retire Next `/whatsapp/**` routes and old Soketi emitters.
- Optimize Nest module (caching, batching analytics).
- Update documentation and operational runbooks.

## 4. Risks & Mitigations

- **Worker Downtime**: Ensure Baileys worker switch is synchronized and fallback paths exist if Nest endpoints fail.
- **Media Proxy**: File streaming must match current behavior to avoid client-side regressions.
- **Event Schema Drift**: Keep Soketi event payloads identical; write tests comparing old/new emitter outputs.
- **Rate Limits**: Monitor outgoing WhatsApp messages to prevent duplicate sends during dual-run.

## 5. Immediate Actions

1. Extract WhatsApp message/session DTOs to shared package (to do).
2. Scaffold Nest module with placeholder controllers/services.
3. Plan worker authentication strategy for Nest (service-to-service tokens).
4. Develop integration tests covering message ingest -> broadcast pipeline.

Following this staged approach keeps production WhatsApp operations intact while migrating control logic to Nest.
