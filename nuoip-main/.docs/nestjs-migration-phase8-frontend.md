# NestJS Migration – Phase 8 Front-End Refactor & Decommission

## 1. Objectives

- Update the Next.js front-end to consume the emerging Nest backend without downtime.
- Introduce abstraction layers (API clients, feature flags) to toggle between monolithic and migrated endpoints.
- Gradually remove Next API routes once Nest equivalents are production-ready.

## 2. Front-End Strategy

1. **API Client Abstraction**
   - Centralize fetch logic in a service layer (e.g., `/src/lib/api-client.ts`).
   - Respect module-specific base URL env vars (e.g., `NEXT_PUBLIC_AUTH_BASE_URL`, `NEXT_PUBLIC_TENANT_API_BASE_URL`).
   - Provide automatic fallback to legacy `/api` endpoints when flags unset.

2. **Feature Flags & Env Management**
   - Use `.env` toggles per module to enable Nest integration incrementally.
   - Document flag matrix and default values for staging vs production.

3. **Component Refactors**
   - Replace direct `fetch('/api/...')` calls with the new client.
   - Ensure hooks (React Query, SWR) can switch base URLs seamlessly.
   - Audit server components for direct Prisma imports; convert them to call APIs.

4. **Realtime Provider Adjustment**
   - Make config/auth endpoints configurable via env variables to point at Nest when ready.

## 3. Decommission Steps

- After each module cutover, remove corresponding Next API routes to prevent drift.
- Update documentation and developer onboarding to reflect new architecture.
- Ensure CI checks fail if deprecated routes are reintroduced.

## 4. Dependencies & Pre-requisites

- Phase 3–7 modules must be functional in Nest.
- Shared DTO packages finalized and consumed by both stacks.
- Feature flag infrastructure implemented.

## 5. Risk Mitigation

- Maintain fallback to legacy endpoints during early rollout.
- Monitor API error rates when toggling modules; provide quick revert path.
- Use A/B testing or staged rollouts for high-impact features.

This plan keeps the front-end operational while gradually retiring Next.js API responsibilities.
