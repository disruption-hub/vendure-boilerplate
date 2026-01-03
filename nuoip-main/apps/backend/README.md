# IPNuo Backend - NestJS API

This is the NestJS backend API for IPNuo, located in the `apps/backend` directory.

## Structure

```
apps/backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller (health check)
│   ├── app.service.ts            # Root service
│   │
│   ├── prisma/                    # Prisma integration
│   │   ├── prisma.module.ts      # Prisma module (global)
│   │   └── prisma.service.ts     # Prisma service (extends PrismaClient)
│   │
│   ├── auth/                      # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # Main auth endpoints (me)
│   │   ├── auth.service.ts       # Auth business logic
│   │   ├── jwt.strategy.ts       # JWT validation strategy
│   │   ├── controllers/          # Specialized auth controllers
│   │   │   ├── admin-auth.controller.ts
│   │   │   └── chat-auth.controller.ts
│   │   └── services/
│   │       └── chat-otp.service.ts
│   │
│   ├── common/                    # Shared utilities
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # JwtAuthGuard, AdminGuard
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts  # @CurrentUser(), @CurrentUserId()
│   │   ├── filters/              # Exception filters (future)
│   │   └── interceptors/         # Response interceptors (future)
│   │
│   └── modules/                   # Feature modules
│       ├── users/                 # (To be migrated)
│       ├── roles/                 # (To be migrated)
│       └── permissions/           # (To be migrated)
│
├── test/                          # Test files
├── dist/                          # Compiled output
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Prisma Schema Location

The Prisma schema is located at the root level: `../../prisma/schema.prisma`

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod
```

## API Endpoints

All endpoints are prefixed with `/api/v1`:

- `GET /api/v1` - Health check
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/chat/request-otp` - Request chat OTP
- `POST /api/v1/auth/chat/verify-otp` - Verify chat OTP

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEST_AUTH_SECRET` or `NEXTAUTH_SECRET` - JWT secret
- `AUTH_TOKEN_EXPIRES_IN` - Token expiration (default: 1h)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)

