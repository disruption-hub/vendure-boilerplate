# Link Database to Nest Backend Service

## Problem

The "Nest Backend" service is failing to start because `DATABASE_URL` is not found.

## Solution: Link PostgreSQL Database to Nest Backend Service

### Step 1: Verify Database Service Exists

1. Go to Railway Dashboard: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
2. Check if you have a PostgreSQL database service in your project
3. If not, create one:
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically create a database service

### Step 2: Link Database to Nest Backend Service

1. **Click on the "Nest Backend" service** (formerly `nuoip`)
2. Go to **"Variables"** tab
3. Look for `DATABASE_URL` in the variables list
4. If `DATABASE_URL` is **NOT** present:
   - Click **"Add Reference"** button
   - Select your **PostgreSQL database service** from the dropdown
   - Railway will automatically add `DATABASE_URL` as a reference variable
5. If `DATABASE_URL` is present but points to `localhost`:
   - **DELETE** the localhost `DATABASE_URL` variable
   - Click **"Add Reference"** and select your PostgreSQL database service

### Step 3: Verify the Link

After linking, you should see:
- `DATABASE_URL` in the variables list
- It should show as a **reference** (not a plain variable)
- The value should start with `postgresql://` and NOT contain `localhost`

### Step 4: Redeploy

After linking the database:
1. The service should automatically redeploy
2. Or manually trigger a redeploy from the Deployments tab
3. Check the logs - you should see:
   - `✅ DATABASE_URL already defined via DATABASE_URL`
   - `✅ Application is running on: http://0.0.0.0:PORT`

## Alternative: Manual Configuration (Not Recommended)

If for some reason you cannot link the database service:

1. Go to your PostgreSQL database service in Railway
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` value
4. Go to **"Nest Backend"** service → **"Variables"** tab
5. Add variable: `DATABASE_URL`
6. Paste the connection string value

**Note**: Using "Add Reference" is preferred because Railway will automatically update the connection string if the database service changes.

## Verification

After linking, check the service logs:

```bash
railway link --service "Nest Backend"
railway logs
```

You should see:
- `✅ DATABASE_URL already defined via DATABASE_URL`
- `✅ Prisma Client initialized and connected to database`
- `✅ Application is running on: http://0.0.0.0:PORT`

## Troubleshooting

### Error: "DATABASE_URL is required but not found"

**Cause**: The database service is not linked to the Nest Backend service.

**Solution**: Follow Step 2 above to link the database.

### Error: "localhost DATABASE_URL detected"

**Cause**: A localhost `DATABASE_URL` is manually set in the service variables.

**Solution**: 
1. Delete the localhost `DATABASE_URL` variable
2. Use "Add Reference" to link the database service instead

### Database service not found

**Cause**: No PostgreSQL database service exists in the Railway project.

**Solution**: 
1. Create a PostgreSQL database service (Step 1 above)
2. Then link it to the Nest Backend service (Step 2 above)

