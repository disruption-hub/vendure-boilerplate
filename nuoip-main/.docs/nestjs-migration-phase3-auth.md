# NestJS Migration – Phase 3 Authentication Blueprint

## 1. Goals

- Introduce NestJS-based authentication services (admin credential login + chatbot phone OTP) without disrupting the production Next.js experience.
- Maintain dual compatibility: NextAuth remains the source of truth until Nest endpoints are validated, and chatbot clients (Zustand store) must transparently switch to the new backend.
- Provide a reversible rollout path with feature flags and staged cutovers.

## 2. Current Auth Architecture Snapshot

### Admin (NextAuth Credentials)
- `src/lib/auth.ts` configures NextAuth with a credentials provider backed by Prisma.
- Session management relies on JWT strategy; user data injected into `session.user`.
- Numerous admin API routes use `getServerSession(authOptions)` for authorization.

### Chatbot Phone OTP
- API route handlers under `src/app/api/(auth)/auth/phone/*` delegate to `src/modules/chatbot/server/chat-auth-service.ts`.
- Zustand store `src/stores/chat-auth-store.ts` invokes endpoints (`/auth/phone/request`, `/auth/phone/verify`, `/auth/phone/session`, `/auth/phone/sync`, `/auth/phone/profile`).
- Chatbot session tokens are used for realtime auth (`/api/chat/realtime/auth`) alongside NextAuth cookies.

### Shared Context
- `src/app/api/chat/shared-auth.ts` merges NextAuth session validation and chatbot token verification.
- Client-side RealtimeProvider chooses between cookie-based and bearer authentication when contacting `/api/chat/realtime/*`.

## 3. Migration Strategy (Incremental)

### Stage 1 – Backend Auth Module Foundations
1. **Nest Modules**: Create `AuthModule` with submodules `AdminAuthModule` and `ChatAuthModule`.
2. **Database Access**: Reuse Prisma client via shared package (to be added in Phase 4). For now, share generated client from existing schema.
3. **DTOs & Services**: Port domain types from `@ipnuo/domain` and reuse logic from `chat-auth-service` with minimal refactoring (wrap in Nest injectables).
4. **Password Verification**: Migrate `bcrypt` usage; ensure identical hash rounds.
5. **OTP Workflows**: Move SMS sending helpers into Nest services but keep Next endpoints active.

### Stage 2 – Compatibility Endpoints (Feature Flagged)
1. **Admin**: Expose Nest endpoints mirroring NextAuth routes (`/auth/login`, `/auth/logout`, `/auth/profile`). For initial rollout, respond with tokens compatible with Next front-end fetchers.
2. **Chatbot**: Add endpoints identical to current payload contracts (`/auth/phone/request`, `/verify`, `/session`, `/sync`, `/profile`).
3. **Gateway Flag**: Introduce environment variable (e.g., `NEXT_PUBLIC_AUTH_BASE_URL`) so front-end/zustand store can switch between `/api/(auth)` and Nest base URL.
4. **Session Validation Endpoint**: Add `/auth/session/validate` that Next.js can call to confirm Nest-issued tokens.
5. **Logging & Metrics**: Implement structured logs for parity comparison.

### Stage 3 – Dual Run & Verification
1. Deploy Nest backend alongside Next. Start by shadowing requests (e.g., optional front-end toggle, QA environment).
2. Compare responses from both stacks for representative scenarios (successful login, invalid password, OTP flows, rate limiting, session refresh).
3. Monitor Prisma queries to ensure concurrency limits are respected.

### Stage 4 – Gradual Cutover
1. **Chatbot First**: Update Zustand store to read `process.env.NEXT_PUBLIC_CHAT_AUTH_BASE_URL` and toggle to Nest. Keep fallback to Next route if Nest call fails during early rollout.
2. **Realtime Auth**: Point RealtimeProvider to Nest `/realtime/auth` once chat sessions verified; ensure shared-auth logic is replicated on backend.
3. **Admin**: After thorough testing, replace NextAuth credential auth with Nest issuance. Optionally run NextAuth in “proxy mode” hitting Nest endpoints to minimize front-end changes.
4. **Session Cookies**: If migrating away from NextAuth, ensure new cookie names do not collide; provide migration script to clear legacy cookies.

### Stage 5 – Decommission & Cleanup
1. Remove Next.js `(auth)` route handlers once dashboards point to Nest.
2. Delete unused Zustand helper logic if replaced by new client SDKs.
3. Update documentation, onboarding scripts, and environment templates.

## 4. Technical Considerations

- **Token Strategy**: Decide early between JWT and opaque tokens. For minimal disruption, replicate NextAuth JWT format initially.
- **CORS & CSRF**: Ensure Nest endpoints respect front-end origins; configure CSRF protections if using cookies.
- **Rate Limiting & Security**: Port existing OTP throttling (`OTP_RESEND_MIN_INTERVAL_SECONDS`, `OTP_MAX_ATTEMPTS`). Consider introducing Nest interceptors/guards for centralized enforcement.
- **Testing**: Build Jest integration tests covering OTP flows, invalid credentials, session expiry. Add e2e smoke tests hitting Nest endpoints in CI.

## 5. Immediate Action Items

1. Extract shared auth DTOs into `@ipnuo/domain/auth` namespace.
2. Scaffold Nest `auth` module with placeholder services and controllers (no production traffic yet).
3. Implement environment flag plumbing in front-end (no switch flipped).
4. Prepare regression checklist referencing existing Markdown guides (`USER_MESSAGING_DEBUG`, `REALTIME_CONTEXT_GUIDE`, etc.).

This blueprint ensures Phase 3 steps are clear while keeping the live system stable through feature toggles and parallel operation.
