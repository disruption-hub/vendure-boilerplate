# Link Database to Baileys Worker Service

## ✅ Progress

The Baileys Worker is now running correctly (no more ESM errors), but it needs `DATABASE_URL` to connect to the database.

## Quick Fix: Link PostgreSQL Database

### Step 1: Go to Baileys Worker Service

1. Go to Railway Dashboard: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
2. Click on the **"Baileys Worker"** service

### Step 2: Link Database

1. Go to **"Variables"** tab
2. Click **"Add Reference"** button
3. Select your **PostgreSQL database service** from the dropdown
4. Railway will automatically add `DATABASE_URL` as a reference variable

### Step 3: Verify

After linking, you should see:
- `DATABASE_URL` in the variables list
- It should show as a **reference** (not a plain variable)
- The value should start with `postgresql://` and NOT contain `localhost`

### Step 4: Service Will Auto-Redeploy

Railway will automatically redeploy the service after you add the reference. The logs should then show:

```
✅ Starting Baileys Worker (standalone - no NestJS)
✅ Runtime require hook loaded
✅ Prisma Client initialized and connected to database
✅ Baileys worker service is running
✅ Worker loop: checking sessions
```

## Alternative: Manual Configuration

If you cannot use "Add Reference":

1. Go to your PostgreSQL database service → **Variables** tab
2. Copy the `DATABASE_URL` value
3. Go to **Baileys Worker** service → **Variables** tab
4. Add variable: `DATABASE_URL`
5. Paste the connection string value

**Note**: Using "Add Reference" is preferred because Railway will automatically update the connection string if the database service changes.

## Both Services Need DATABASE_URL

Both services need `DATABASE_URL`:
- ✅ **Nest Backend**: Already configured (or needs to be linked)
- ❌ **Baileys Worker**: Needs to be linked (current issue)

Both can reference the same PostgreSQL database service - Railway allows multiple services to reference the same database.

## Verification

After linking, check the logs:

```bash
railway link --service "Baileys Worker"
railway logs
```

You should see:
- `✅ Prisma Client initialized and connected to database`
- `✅ Baileys worker service is running`
- `✅ Worker loop: checking sessions`

**NOT**:
- `❌ DATABASE_URL is required but not found`

