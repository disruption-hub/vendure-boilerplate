import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Load DATABASE_URL from environment, with fallback for generation
// During prisma generate, DATABASE_URL may not be required
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname'

export default defineConfig({
  // The main entry for your schema
  schema: './schema.prisma',
  
  // Where migrations should be generated
  migrations: {
    path: './migrations',
  },
  
  // The database URL - moved from schema.prisma
  // Using process.env directly to avoid PrismaConfigEnvError during generation
  datasource: {
    url: databaseUrl,
    // For migrations, use the same URL (directUrl is deprecated)
    // If you need a separate connection for migrations, set it here
    // shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
})
