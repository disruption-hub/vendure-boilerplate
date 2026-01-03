# NestJS Migration – Phase 7 Payments, CRM, Memory/Search

## 1. Scope Summary

- **Payments**: Routes under `(payments)/payments/lyra/**` (webhooks, link/form token management) and `(admin)/admin/payments/**` (products, taxes, reports).
- **CRM**: `crm/**` endpoints handling customers, tickets, drafts, comments, attachments.
- **Memory/Search**: `(memory)/memory/**`, `(search)/search-unified/route.ts`, ingestion scripts for knowledge base and vector search.

## 2. Migration Objectives

- Port domain-specific logic into Nest modules without interrupting current invoicing, ticketing, or knowledge base workflows.
- Ensure webhook handlers (Lyra payments) are migrated carefully with duplicate-delivery safeguards.
- Maintain existing analytics and reporting data integrity.

## 3. High-Level Plan

### Stage A – Shared DTO Extraction
- Export payment-related types (e.g., Lyra link payloads, webhook structures) and CRM ticket/customer interfaces into `@ipnuo/domain`.
- Identify memory/search data structures (knowledge graph entries, stats) for shared typing.

### Stage B – Module Skeletons
- **PaymentsModule**: Controllers for link generation, webhook ingestion, tax/product management; include signature verification utilities.
- **CrmModule**: Services for customer CRUD, ticket state machine, comment attachments (ensure file handling strategy defined).
- **MemoryModule**: APIs for ingestion, cleanup, stats; integrate with vector DB/Meilisearch clients.

### Stage C – Parallel Operation Strategy
- Start with read-only endpoints (e.g., list customers, payment reports) pointing to Nest to validate parity.
- For webhooks, mirror events to Nest (shadow mode) and compare stored records. Only cut over once verified.
- Provide fallback path (e.g., if Nest link generation fails, call existing Next endpoint while logging).

### Stage D – Front-End & Script Updates
- Update admin UI services to honor new base URL flags.
- Adjust CLI scripts and background jobs to target Nest endpoints or internal services.
- Ensure monitoring dashboards track both old/new pipelines during transition.

### Stage E – Cleanup & Optimization
- Once stable, decommission corresponding Next routes.
- Consolidate recurring jobs (e.g., cleanup scripts) into Nest scheduled tasks if appropriate.

## 4. Risks & Mitigation

- **Webhook Reliability**: Implement idempotency checks in Nest; monitor for duplicate charges.
- **Attachment Storage**: Confirm CRM attachment upload/download flows match current behavior.
- **Data Consistency**: Coordinate migrations with DBA; ensure transactions and data integrity across new services.

## 5. Immediate Action Items

1. Inventory payment/CRM data models for shared DTO export.
2. Scaffold Nest modules with placeholder controllers and services.
3. Plan webhook proxy/shadowing strategy.
4. Define regression tests referencing existing Markdown runbooks.

This blueprint enables safe, staged migration of remaining vertical modules while the Next.js system continues uninterrupted.
