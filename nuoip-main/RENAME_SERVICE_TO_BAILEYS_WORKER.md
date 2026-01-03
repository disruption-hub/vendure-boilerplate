# Rename Railway Services

## Service Renaming Instructions

Railway CLI **does not support renaming services**. You must rename them via the Railway Dashboard.

## Service 1: Rename `nuoip` to "Nest Backend"

### Steps:

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
   - Find the service: `nuoip`

2. **Rename the Service:**
   - Click on the service `nuoip`
   - Go to **Settings** → **Service Settings**
   - Click on the service name at the top (or find "Service Name" field)
   - Change from: `nuoip`
   - Change to: `Nest Backend`
   - Click **Save**

3. **Verify:**
   - The service name should now show as "Nest Backend" in the dashboard
   - After renaming, you may need to re-link via CLI:
     ```bash
     railway link --service "Nest Backend"
     ```

## Service 2: Rename `nuoip-worker` to "Baileys Worker"

### Steps:

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app/project/99370a3c-0bda-423f-b4ff-7697000cfcb1
   - Find the service: `nuoip-worker`

2. **Rename the Service:**
   - Click on the service `nuoip-worker`
   - Go to **Settings** → **Service Settings**
   - Click on the service name at the top (or find "Service Name" field)
   - Change from: `nuoip-worker`
   - Change to: `Baileys Worker`
   - Click **Save**

3. **Verify:**
   - The service name should now show as "Baileys Worker" in the dashboard
   - After renaming, you may need to re-link via CLI:
     ```bash
     railway link --service "Baileys Worker"
     ```

## Final Service Names

After renaming:
- **`Nest Backend`** (formerly `nuoip`) → NestJS Backend API
- **`Baileys Worker`** (formerly `nuoip-worker`) → Baileys WhatsApp Worker

