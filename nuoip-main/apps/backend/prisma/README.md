# Prisma Usage for Nest Backend

- This backend reuses the canonical Prisma schema located at `../prisma/schema.prisma`.
- Run migrations and code generation from the backend workspace using the npm scripts defined in `backend/package.json`:
  - `npm run prisma:generate`
  - `npm run prisma:migrate:deploy`
- Consider creating a dedicated generator output path in a future phase if the backend requires an isolated Prisma client bundle.
