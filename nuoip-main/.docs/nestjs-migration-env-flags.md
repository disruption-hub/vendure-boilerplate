# NestJS Migration – Environment Flags

These variables let the front-end switch between legacy Next.js APIs and the new NestJS backend without code changes.

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_AUTH_BASE_URL` | Overrides `/api/(auth)` endpoints when set (Phase 3). | Empty (falls back to Next routes). |
| `NEXT_PUBLIC_CHAT_AUTH_BASE_URL` | Directs chatbot OTP store to Nest endpoints. | Empty. |
| `NEXT_PUBLIC_REALTIME_BASE_URL` | Points realtime config/auth requests to Nest (Phase 5). | Empty. |
| `NEXT_PUBLIC_TENANT_API_BASE_URL` | Switches tenant/admin API calls (Phase 4). | Empty. |
| `NEXT_PUBLIC_WHATSAPP_API_BASE_URL` | Switches WhatsApp admin views to Nest (Phase 6). | Empty. |

### Usage

Add the variables to `.env.local` (or deployment env) as they become available, e.g.:

```
NEXT_PUBLIC_AUTH_BASE_URL=https://backend.example.com
```

Client fetch helpers should read the value and fall back to `/api/...` when undefined, ensuring safe rollout.
