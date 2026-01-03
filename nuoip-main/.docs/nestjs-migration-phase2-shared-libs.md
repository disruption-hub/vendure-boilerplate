# NestJS Migration – Phase 2 Shared Library Strategy

## 1. Objectives

- Create a sustainable shared code layer (`packages/`) that both the Next.js front-end and the new NestJS backend can rely on without duplicating business logic.
- Prioritize extraction of pure TypeScript utilities, type definitions, and configuration helpers before moving complex service logic.
- Ensure all changes are additive so the existing Next.js application remains functional throughout the migration.

## 2. Current Deliverables

- Established initial packages:
  - `@ipnuo/domain`: central place for shared domain types. Now re-exports key Prisma models/enums (Tenant, User, WhatsApp entities) plus the existing `HealthPayload` interface.
  - `@ipnuo/utils`: hosts generic helpers (currently `assertDefined`).
- Backend already consumes `@ipnuo/domain` for the health DTO, validating the path alias wiring without touching Next.js.

## 3. Extraction Targets & Sequencing

| Priority | Target Module / File Set                         | Notes |
|----------|--------------------------------------------------|-------|
| High     | `src/lib/chatbot/user-thread-utils.ts`, message/domain types | Pure helpers and DTOs used across API routes and front-end components. |
| High     | `src/lib/realtime/soketi.ts` type definitions (not runtime) | Extract interfaces/config shapes while keeping runtime in place. |
| High     | `src/modules/chatbot/domain/auth.ts` type exports | Shared between Zustand store, APIs, and future Nest auth module. |
| Medium   | `src/lib/services/admin/system-config-service.ts` data interfaces | Begin by exporting config schemas; defer runtime cache logic to later phases. |
| Medium   | Payment DTOs under `(payments)` routes            | Provide typed contracts for Lyra payloads and responses. |
| Low      | UI-only helper types (e.g., design tokens)        | Migrate later or leave front-end specific. |

## 4. Extraction Guidelines

1. **Additive Changes**: Copy or re-export types into shared packages first; update imports gradually in both codebases only after verification.
2. **Dual Compatibility**: Keep shared package outputs ES2019/ES2021 compatible to satisfy both Next.js and NestJS builds.
3. **Peer Dependencies**: Use `peerDependencies` for heavy packages (e.g., `@prisma/client`) to avoid duplicate installations.
4. **Build Validation**: Introduce lightweight CI job (future phase) to `npm run build` each shared package and the backend.
5. **Version Control**: Defer publishing; rely on workspace linking. Root scripts can later invoke `npm --workspace` commands.

## 5. Immediate Next Actions

1. Inventory concrete type definitions within `src/lib` and `src/modules` that should migrate (create checklist for each file).
2. Add index barrel files inside shared packages for upcoming modules (e.g., `@ipnuo/domain/chat`, `@ipnuo/domain/realtime`).
3. Update backend and, later, Next.js to consume new exports once verified.
4. Plan lint/build pipeline updates to ensure cross-package type safety.

## 6. Risk Mitigation

- Avoid moving runtime logic that depends on Next.js-specific APIs until the backend equivalent exists.
- Ensure Prisma types remain the single source of truth—re-export instead of redefining.
- Document any shared enums/constants in the package README to avoid divergence.

Phase 2 now has a clear roadmap and foundational scaffolding, enabling gradual extraction of shared domain artifacts while keeping the current system stable.
