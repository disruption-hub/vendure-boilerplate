# NestJS Migration – Phase 4 Tenant & Admin APIs

## 1. Target Scope

- Tenant management endpoints currently under `(admin)/admin/tenants/**`, `(admin)/admin/tenant/preferences`, `tenants/[tenantId]/customization`, etc.
- Admin user management (`(admin)/admin/users/**`, revoke sessions, profile picture uploads).
- System configuration surfaces (Brevo, LabsMobile, OpenRouter, VAPID, Soketi) to be migrated after tenant CRUD but within the same phase due to shared ownership.

## 2. Coexistence Principles

1. **Backend-first, Frontend-second**: Build Nest controllers/services that replicate the Next API responses. Only redirect front-end traffic after parity tests.
2. **Feature Flags**: Introduce per-module flags (`NEXT_PUBLIC_TENANT_API_BASE_URL`, etc.) so admin UI can switch between `/api` and Nest endpoints without redeploying backend.
3. **Read-only Cutover Option**: Start by serving GET endpoints from Nest while keeping mutating operations on Next until confidence is gained.

## 3. Implementation Roadmap

### Stage A – Service Abstractions
- Extract tenant/admin DTOs into `@ipnuo/domain` (done: TenantSummary, TenantPreferencePayload, AdminUserSummary).
- Create Nest providers wrapping existing Prisma logic (`TenantService`, `AdminUserService`, `SystemConfigService`).
- Port helper utilities (e.g., `system-config-service`) in a controlled manner—begin with pure read operations.

### Stage B – Controller Parity
- Implement controllers mirroring key routes:
  - `GET /admin/tenants`, `GET /admin/tenants/:id`, `PATCH /admin/tenants/:id`.
  - `GET /admin/users`, `POST /admin/users/revoke-sessions`.
  - `GET/PUT /admin/tenant/preferences`.
- Map Nest responses to existing front-end expectations (field names, status codes).
- Integrate authentication guards leveraging Phase 3 auth outputs.

### Stage C – Incremental Front-End Switch
- Update front-end API clients (e.g., React Query hooks) to read new base URL flag.
- Roll out read-only routes first; monitor logs and compare metrics.
- Transition mutation endpoints once smoke tests pass;
- Maintain fallback to Next endpoints during early rollout (retry mechanism).

### Stage D – Config Management
- Move Brevo/LabsMobile/OpenRouter/VAPID/Soketi config endpoints last, as they involve side effects and caching.
- Ensure Nest uses centralized caching layer (Redis or in-memory with invalidation) to replace `system-config-service` behavior.
- Validate via regression scripts in `SOKETI_TESTING_GUIDE.md` and similar documents.

## 4. Testing & Verification

- Unit tests for each Nest service covering Prisma interactions.
- Integration tests against a staging database snapshot verifying tenant CRUD and system config updates.
- Front-end QA: admin dashboard flows (tenant edit, user revoke, config update) executed in staging environment pointing to Nest.

## 5. Risks & Mitigations

- **Cache Divergence**: Ensure Nest invalidates configuration caches consistently; consider disabling Next cache once Nest takes ownership.
- **File Uploads**: Profile picture/logo uploads require streaming; confirm Nest uses `@nestjs/platform-express` with identical storage mechanisms.
- **Concurrency**: Prisma connection limits must be monitored when both stacks run simultaneously.

## 6. Immediate Action Items

1. Build Nest module skeletons (`tenant`, `admin`, `system-config`).
2. Add workspace scripts to run backend tests once functionality arrives.
3. Prepare front-end API client abstraction to ease base URL swap.

This plan keeps the production system operational while Nest assumes responsibility for tenant and admin capabilities in measured increments.
