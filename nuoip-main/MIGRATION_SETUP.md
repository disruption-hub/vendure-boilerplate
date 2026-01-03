# Automatic Database Migrations on Railway

## Overview

This project is now configured to **automatically run Prisma database migrations** on every Railway deployment. This ensures your database schema is always in sync with your Prisma schema.

## What Was Fixed

### The Problem
Railway deployments were failing with this error:
```
PrismaClientKnownRequestError: 
Invalid `prisma.tenantUserChatMessage.findMany()` invocation:

The column `(not available)` does not exist in the current database.
  code: 'P2022',
  meta: {
    originalCode: '42703',
    originalMessage: 'column chat_attachments.data does not exist',
  }
```

**Root Cause**: The Prisma schema had a migration (`20251124133803_add_attachment_data`) that added the `chat_attachments.data` column, but this migration was never applied to the Railway production database.

### The Solution

Modified `nixpacks.toml` to run `prisma migrate deploy` automatically on every Railway deployment **before** starting the NestJS backend. This ensures:

1. ✅ All pending migrations are applied to the database
2. ✅ The database schema matches the Prisma schema
3. ✅ No manual intervention needed for future schema changes

## How It Works

### Deployment Flow

When you deploy to Railway, the following happens automatically:

```bash
1. Install dependencies (npm install)
2. Generate Prisma Client
3. Build NestJS application
4. 🔄 Run database migrations ← NEW!
5. Start the backend server
```

### Modified Files

#### 1. `nixpacks.toml` (Line 60)
```toml
[start]
cmd = "... && npx prisma migrate deploy --schema ./schema.prisma && ..."
```

**What it does**: 
- Runs all pending migrations before starting the app
- Uses the `DATABASE_URL` from Railway environment variables
- Fails the deployment if migrations fail (prevents broken deployments)

#### 2. `scripts/deploy-migrations.sh` (NEW)
A standalone script you can use to manually run migrations:

```bash
export DATABASE_URL="your-railway-database-url"
./scripts/deploy-migrations.sh
```

## Deploying the Fix

### Step 1: Commit Changes

```bash
git add nixpacks.toml scripts/deploy-migrations.sh MIGRATION_SETUP.md
git commit -m "feat: auto-run database migrations on Railway deploy"
git push origin main
```

### Step 2: Railway Auto-Deploy

Railway will automatically:
1. Detect the push to `main`
2. Build the application
3. **Run the pending migration** (`20251124133803_add_attachment_data`)
4. Add the missing `chat_attachments.data` column
5. Start the backend successfully ✅

### Step 3: Verify

After deployment, check the Railway logs for:

```
=== Deploying Prisma Migrations to Railway Database ===
Applying migration `20251124133803_add_attachment_data`
✅ All migrations applied successfully
=== Starting NestJS Backend ===
```

## Future Migrations

From now on, whenever you create a new Prisma migration:

1. **Locally**: 
   ```bash
   cd packages/prisma
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit the migration**:
   ```bash
   git add packages/prisma/migrations/
   git commit -m "feat: add new migration"
   git push
   ```

3. **Railway automatically applies it** on next deployment! 🎉

## Manual Migration (If Needed)

If you need to manually trigger migrations without deploying:

### Option 1: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run ./scripts/deploy-migrations.sh
```

### Option 2: Using the Script Locally

```bash
# Get DATABASE_URL from Railway dashboard
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/DATABASE"

# Run migrations
./scripts/deploy-migrations.sh
```

### Option 3: Railway Dashboard

1. Go to Railway Dashboard → Your Project → Nest Backend
2. Click "Variables" tab
3. Copy the `DATABASE_URL` value
4. Run locally:
   ```bash
   DATABASE_URL="<copied-url>" ./scripts/deploy-migrations.sh
   ```

## Troubleshooting

### Migration Fails on Deploy

**Check Railway logs for**:
- `❌ Migration deployment failed`
- Specific error messages from Prisma

**Common issues**:
1. **Database connection failed**: Check if `DATABASE_URL` is set correctly
2. **Migration conflict**: A migration was manually edited after being applied
3. **Schema drift**: Database was manually modified

**Solution**: Check the specific error and:
```bash
# If migration is already applied but marked as failed
cd packages/prisma
npx prisma migrate resolve --applied <migration-name>

# If migration needs to be rolled back
npx prisma migrate resolve --rolled-back <migration-name>
```

### Migration Already Applied

If the logs show:
```
No pending migrations to apply.
```

This is **normal** and means your database is already up to date! ✅

## Files Changed

| File | Status | Description |
|------|--------|-------------|
| `nixpacks.toml` | Modified | Added automatic migration deployment to start command |
| `scripts/deploy-migrations.sh` | Created | Manual migration deployment script |
| `MIGRATION_SETUP.md` | Created | This documentation |

## Related Migration

The specific migration that will be applied:
- **Name**: `20251124133803_add_attachment_data`
- **What it does**: 
  - Creates `chat_attachments` table (if not exists)
  - Adds `data` TEXT column for storing attachment data
  - Creates ticket-related tables (tickets, ticket_comments, ticket_attachments)
  - Updates various timestamp columns to TIMESTAMP(3)

## Benefits

✅ **No manual database updates needed**  
✅ **Zero-downtime deployments** (migrations run before app starts)  
✅ **Fail-fast** (deployment fails if migration fails)  
✅ **Consistent across environments** (staging, production, etc.)  
✅ **Version controlled** (all schema changes in git)  

## Next Steps

1. **Commit and push** the changes
2. **Monitor Railway deployment logs**
3. **Verify** the error is gone
4. **Test** the chat attachment functionality

---

**Created**: 2025-11-24  
**Last Updated**: 2025-11-24  
**Status**: ✅ Ready to deploy
