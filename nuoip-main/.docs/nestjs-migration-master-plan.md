# NestJS Backend Migration Master Plan

This document links the detailed phase reports outlining the transition from the current Next.js monolith to a NestJS backend while keeping the system functional throughout the migration.

## Phase Index

1. **Phase 0 – Discovery & Alignment**  
   Summary of existing API surface, shared modules, and configuration inventory.  
   👉 `docs/nestjs-migration-phase0-discovery.md`

2. **Phase 1 – Backend Workspace Bootstrap**  
   NestJS project scaffold, Prisma integration, shared package foundations.  
   👉 `docs/nestjs-migration-phase1-bootstrap.md`

3. **Phase 2 – Shared Libraries Strategy**  
   Plan for extracting shared domain/types utilities.  
   👉 `docs/nestjs-migration-phase2-shared-libs.md`

4. **Phase 3 – Authentication Blueprint**  
   Incremental migration of admin and chatbot auth flows.  
   👉 `docs/nestjs-migration-phase3-auth.md`

5. **Phase 4 – Tenant & Admin APIs**  
   Roadmap for tenant management and system config endpoints.  
   👉 `docs/nestjs-migration-phase4-tenant-admin.md`

6. **Phase 5 – Realtime & Chat**  
   Strategy for Soketi/Pusher and chat thread migration.  
   👉 `docs/nestjs-migration-phase5-realtime-chat.md`

7. **Phase 6 – WhatsApp Integration**  
   Plan for migrating WhatsApp sessions, worker coordination, and analytics.  
   👉 `docs/nestjs-migration-phase6-whatsapp.md`

8. **Phase 7 – Vertical Modules**  
   Payments, CRM, memory/search migration roadmap.  
   👉 `docs/nestjs-migration-phase7-verticals.md`

9. **Phase 8 – Front-End Refactor & Decommission**  
   Guidance for feature flags, API abstraction, and cleanup of legacy routes.  
   👉 `docs/nestjs-migration-phase8-frontend.md`

10. **Phase 9 – Hardening & Optimization**  
    Post-migration monitoring, performance, and developer-experience tasks.  
    👉 `docs/nestjs-migration-phase9-hardening.md`

## Shared Packages

- `packages/domain`: Re-exported Prisma models/enums plus shared DTOs for auth, admin, realtime, WhatsApp, payments, and CRM.
- `packages/utils`: Placeholder utilities (e.g., `assertDefined`) ready for expansion.

## Backend Workspace

- `backend/`: NestJS scaffold with health endpoint and tests; uses shared packages and existing Prisma schema.

This index provides a single entry point into the migration effort so contributors can follow the phased rollout and associated assets.
