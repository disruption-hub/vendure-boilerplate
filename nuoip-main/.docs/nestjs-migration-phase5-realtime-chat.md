# NestJS Migration – Phase 5 Realtime & Chat

## 1. Current System Overview

- **Client**: `src/contexts/RealtimeContext.tsx` initializes Pusher (Soketi) using `/api/chat/realtime/config` and `/api/chat/realtime/auth` endpoints, relying on NextAuth cookies or chatbot bearer tokens.
- **Server**: Route handlers under `/api/chat/realtime/*`, `chat/user-threads/*`, and `(chatbot)/tenant-chatbot/*` manage subscriptions, message delivery, read receipts, typing notifications, and scheduled message workflows.
- **Broadcasting**: `src/lib/realtime/soketi.ts` and `src/lib/whatsapp/integration/soketi-emitter.ts` trigger Soketi events; caching logic in `system-config-service` controls configuration fetches.
- **State Stores**: `useChatAuthStore` (Zustand) provides session tokens used in realtime authorization.

## 2. Migration Goals

- Reproduce realtime configuration/auth endpoints and chat thread APIs inside Nest without breaking active WebSocket connections.
- Consolidate broadcasting logic into Nest services while maintaining event schema compatibility.
- Ensure chat UI (FullScreenChatbot, WhatsApp components, admin realtime dashboards) remain operational during migration.

## 3. Shared Types Enhancement

- Added `RealtimeConfigPayload`, `RealtimeAuthPayload`, and `TenantThreadEventPayload` to `@ipnuo/domain` for consistent payload typing across stacks.
- Future additions: typing for read/delivery receipts, typing indicators, WhatsApp realtime events.

## 4. Staged Migration Plan

### Stage A – Backend Realtime Module Skeleton
1. Create Nest `RealtimeModule` housing services for Soketi configuration retrieval and authorization.
2. Mirror existing cache strategy (initially in-memory TTL, optionally upgrade to Redis).
3. Implement Nest endpoints `/chat/realtime/config` and `/chat/realtime/auth` using shared DTOs.
4. Integrate authentication guard leveraging Phase 3 outputs (NextAuth-equivalent + chatbot tokens).

### Stage B – Chat Thread Service Port
1. Build Nest services for chat threads: message fetch, read/delivery updates, typing signals.
2. Expose controllers matching Next routes (`/chat/user-threads/*`, `(chatbot)/tenant-chatbot/*`).
3. Preserve pagination, error handling, and session validation semantics.
4. Adopt shared DTOs in request/response shapes.

### Stage C – Broadcasting Consolidation
1. Move Soketi emitter logic into Nest injectable(s); maintain fallback logs for debugging.
2. Provide wrapper methods (`broadcastTenantMessage`, `broadcastWhatsAppEvent`, etc.) callable by both Nest controllers and any remaining Next code during transition.
3. Gradually switch workers (e.g., Baileys) to call Nest endpoints/services.

### Stage D – Front-End Cutover & Validation
1. Introduce environment toggle for realtime config/auth base URL in front-end.
2. Roll out in controlled environments; compare logs to confirm authorization success, subscription health, and absence of 401 loops.
3. Sequentially migrate chat CRUD endpoints, verifying with staging chat sessions and regression scripts (`REALTIME_CONTEXT_GUIDE.md`, `SOKETI_TESTING_GUIDE.md`).
4. Monitor Pusher metrics; ensure connection counts, event deliveries, and retry behavior stay within expected ranges.

### Stage E – Cleanup
1. Decommission Next `/api/chat/realtime/*` and `/chat/user-threads/*` once fully verified.
2. Remove redundant caching hacks in `system-config-service`; centralize in Nest.
3. Update documentation and BAU runbooks.

## 5. Risk Mitigation

- **Auth Compatibility**: Validate dual-mode authentication (NextAuth cookies + chatbot bearer tokens) before switching main traffic.
- **Cache Invalidation**: Ensure Nest cache invalidation matches current debug behavior (manual clear logs, TTL).
- **Retry Storms**: During rollout, cap subscription retries to avoid load spikes if Nest endpoints misbehave.
- **Worker Coordination**: Update Baileys worker scripts to hit Nest endpoints synchronously with front-end cutover.

## 6. Immediate Next Steps

1. Scaffold Nest `realtime` module with placeholder services/controllers (no production routing yet).
2. Add tests covering config/auth payload formatting using shared domain types.
3. Prepare front-end feature flags for realtime base URL swapping.
4. Inventory all realtime event types for future TypeScript exports.

Following this roadmap keeps realtime features stable while Nest gradually assumes responsibility for chat and Soketi orchestration.
