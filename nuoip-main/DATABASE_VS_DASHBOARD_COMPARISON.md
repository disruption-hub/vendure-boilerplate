# Database vs Dashboard Comparison Guide

## Summary

The backend services return **ALL** users and tenants from the database without any filters. However, there may be differences between what you see in Prisma Studio and what appears in the dashboard UI.

## Backend Behavior

### Users Service (`apps/backend/src/admin/users.service.ts`)
- **`listUsers()`** returns ALL users from the database
- No filtering by status, tenant, or role
- Orders by `createdAt: 'desc'` (newest first)
- Returns: `id`, `email`, `name`, `role`, `tenantId`, `status`, `createdAt`, `updatedAt`

### Tenants Service (`apps/backend/src/admin/tenants.service.ts`)
- **`listTenants()`** returns ALL tenants from the database
- No filtering by `isActive` status
- Orders by `createdAt: 'desc'` (newest first)
- Includes aggregated counts: `userCount`, `trademarkCount`, `memorySessionCount`

## Frontend Behavior

### User Management Dashboard
- Shows ALL users returned from the backend
- **Client-side filtering** by:
  - Tenant (dropdown filter)
  - Search term (name, email, phone)
- **No filtering by user status** (invited, active, suspended, inactive)
- Groups users by tenant in the display

### Tenant Management Dashboard
- Shows ALL tenants returned from the backend
- **Stats count** filters to show only active tenants: `tenants.filter(t => t.isActive !== false).length`
- **Tenant list** shows ALL tenants (both active and inactive)
- Displays `isActive` status badge for each tenant

## Possible Reasons for Differences

### 1. **Different Databases**
- Prisma Studio connects to: Database specified in `.env` → `DATABASE_URL`
- Dashboard connects to: Backend API → Same database via `DATABASE_URL`
- **Verify**: Check if both are using the same `DATABASE_URL`

### 2. **Caching**
- Browser cache might show old data
- **Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 3. **Active Filters in UI**
- User Management: Check if tenant filter is set to a specific tenant
- User Management: Check if search term is filtering results
- **Solution**: Clear all filters in the dashboard

### 4. **Timing**
- Records created/deleted between viewing Prisma Studio and dashboard
- **Solution**: Refresh both at the same time

### 5. **Soft Deletes**
- If soft deletes are implemented, Prisma Studio shows all records including deleted
- Dashboard might filter out soft-deleted records
- **Current Status**: No soft delete implementation found in backend services

## How to Verify

### Step 1: Check Database Connection
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Step 2: Count Records in Prisma Studio
1. Open Prisma Studio: `http://localhost:5555`
2. Go to `User` table → Count total records
3. Go to `Tenant` table → Count total records

### Step 3: Check Backend API Response
```bash
# Get auth token from browser localStorage
# Then test the API directly:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://nuoip-production.up.railway.app/api/v1/admin/users

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://nuoip-production.up.railway.app/api/v1/admin/tenants
```

### Step 4: Check Dashboard Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs:
   - `[UserManagement] Fetched users data:`
   - `[UserManagement] Normalized users:`
   - `[TenantManagement] Fetched tenants data:`
   - `[TenantManagement] Normalized tenants:`

### Step 5: Clear Filters
- User Management: Set tenant filter to "All"
- User Management: Clear search box
- Refresh the page

## Expected Behavior

### Users
- **Prisma Studio**: Shows ALL users (including all statuses: invited, active, suspended, inactive)
- **Dashboard**: Shows ALL users (but can be filtered by tenant/search)
- **Count should match** if no filters are applied

### Tenants
- **Prisma Studio**: Shows ALL tenants (including inactive ones)
- **Dashboard**: Shows ALL tenants (both active and inactive)
- **Stats count**: Only counts active tenants (`isActive !== false`)
- **List count**: Should match Prisma Studio count

## Troubleshooting

If counts don't match:

1. **Check browser console** for API errors
2. **Verify authentication** - Make sure you're logged in as admin/super_admin
3. **Check network tab** - Verify API responses
4. **Compare timestamps** - Check `createdAt` and `updatedAt` in both
5. **Check for deleted records** - Prisma Studio might show records that were soft-deleted

## Current Implementation Notes

- ✅ Backend returns ALL records (no filtering)
- ✅ Frontend displays ALL records (with optional client-side filtering)
- ⚠️ Stats count for tenants filters to active only (this is intentional for the stats display)
- ✅ No soft delete implementation (all records are permanent)

## Recommendations

If you want the dashboard to match Prisma Studio exactly:

1. **Remove client-side filters** (if you want to see everything)
2. **Add server-side filtering** (if you want to filter by status/active)
3. **Add a toggle** to show/hide inactive tenants in the UI
4. **Add a toggle** to show/hide users by status in the UI

