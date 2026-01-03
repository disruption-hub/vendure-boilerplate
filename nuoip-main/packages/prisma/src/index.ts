/**
 * @ipnuo/prisma - Prisma Client Package
 * 
 * This package exports the PrismaClient and related types for use across the monorepo.
 * The Prisma schema is located at the root of this package: ../schema.prisma
 */

import { PrismaClient, Prisma } from '@prisma/client'
export { PrismaClient, Prisma }

// Re-export commonly used types
export type {
  Prisma as PrismaNamespace,
} from '@prisma/client'

// Export a singleton instance factory (optional, for convenience)
let prismaClientInstance: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prismaClientInstance) {
    prismaClientInstance = new PrismaClient()
  }
  return prismaClientInstance
}

