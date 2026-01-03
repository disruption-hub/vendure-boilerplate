# Railway + Vercel Configuration

This project is configured to work with both Railway (Baileys worker) and Vercel (Next.js UI/UX).

## Architecture

- **Vercel**: Hosts the Next.js application (UI/UX, API routes)
  - Automatically detects Next.js and runs `npm run build`
  - Build includes: `prisma migrate deploy && next build`
  - Serves the full application with UI/UX

- **Railway**: Hosts the Baileys WhatsApp worker service
  - Uses `nixpacks.toml` configuration
  - Skips Next.js build (only needs TypeScript runtime with `tsx`)
  - Runs `npm run worker:baileys` to start the persistent worker
  - Connects to the same database as Vercel

## Configuration Files

### `nixpacks.toml` (Railway)
- Specifies Node.js 20
- Installs all dependencies (including dev for `tsx`)
- Skips Next.js build phase
- Starts Baileys worker directly

### `railway.json` (Railway)
- Configures Railway to use Nixpacks builder
- Sets start command to `npm run worker:baileys`
- No healthcheck (worker is persistent, not HTTP)

### `vercel.json` (Vercel)
- Configures Next.js framework
- Sets API route timeout to 30 seconds
- Vercel automatically detects and builds Next.js

### `package.json`
- `build`: Full build for Vercel (includes Next.js)
- `build:worker`: Prisma client generation only
- `worker:baileys`: Starts the Baileys worker service

## How It Works

1. **Vercel Deployment**:
   - Vercel detects `next` in package.json
   - Runs `npm run build` automatically
   - Builds Next.js application with UI/UX
   - Deploys to Vercel edge network

2. **Railway Deployment**:
   - Railway reads `nixpacks.toml`
   - Installs dependencies (including `tsx`)
   - Skips Next.js build (echo only)
   - Runs `npm run worker:baileys`
   - Worker connects to shared database

## Shared Resources

- **Database**: Both services connect to the same PostgreSQL database
- **Environment Variables**: Both need:
  - `DATABASE_URL`: PostgreSQL connection string
  - `SOKETI_*`: Real-time WebSocket configuration
  - Other shared configs

## Worker Functionality

The Baileys worker:
- Monitors database for active WhatsApp sessions
- Maintains Baileys socket connections
- Handles QR code generation and pairing
- Keeps connections alive and reconnects on failure
- Runs continuously (not HTTP-based)

## Notes

- Railway worker doesn't need Next.js build (saves build time and resources)
- Vercel handles all UI/UX rendering
- Both services can be deployed independently
- Database migrations run on Vercel build (via `prisma migrate deploy`)
- Prisma client is generated in `postinstall` hook for both environments

