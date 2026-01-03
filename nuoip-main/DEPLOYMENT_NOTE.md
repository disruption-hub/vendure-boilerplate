# Vercel Deployment Configuration

## Important: Root Directory Setting

The Vercel project **nextjs** needs to have the **Root Directory** set to `apps/nextjs` in the Vercel dashboard.

### Steps to Configure:

1. Go to https://vercel.com/matmaxworlds-projects/nextjs/settings
2. Navigate to **General** settings
3. Find **Root Directory** setting
4. Set it to: `apps/nextjs`
5. Save the changes

### Current vercel.json Configuration:

The `vercel.json` file is configured for the monorepo structure:
- `buildCommand`: Builds from `apps/nextjs`
- `installCommand`: Installs dependencies for Prisma and Next.js

### After Setting Root Directory:

Once the root directory is set in the dashboard, you can deploy with:
```bash
vercel --prod
```

Or it will auto-deploy on git push if connected to a repository.

