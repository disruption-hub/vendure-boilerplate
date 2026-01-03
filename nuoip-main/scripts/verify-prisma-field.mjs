#!/usr/bin/env node
/**
 * Verification script to check if paymentReturnHomeUrl exists in Prisma client
 * This script will fail if the field is missing, ensuring the build fails early
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const FIELD_NAME = 'paymentReturnHomeUrl'
const MONOREPO_ROOT = resolve(process.cwd())

// Possible locations where Prisma client might be generated
const PRISMA_CLIENT_LOCATIONS = [
  resolve(MONOREPO_ROOT, 'packages', 'prisma', 'node_modules', '@prisma', 'client'),
  resolve(MONOREPO_ROOT, 'node_modules', '@prisma', 'client'),
  resolve(MONOREPO_ROOT, 'apps', 'backend', 'node_modules', '@prisma', 'client'),
]

// Files to check for the field
const FILES_TO_CHECK = [
  'index.d.ts', // TypeScript definitions
  'index.js',   // JavaScript implementation
]

console.log('🔍 Verifying Prisma client includes paymentReturnHomeUrl field...')
console.log(`📁 Checking locations: ${PRISMA_CLIENT_LOCATIONS.length}`)

let foundClient = false
let foundField = false
let checkedLocation = null

for (const clientLocation of PRISMA_CLIENT_LOCATIONS) {
  if (!existsSync(clientLocation)) {
    console.log(`⏭️  Skipping (not found): ${clientLocation}`)
    continue
  }

  foundClient = true
  checkedLocation = clientLocation
  console.log(`✅ Found Prisma client at: ${clientLocation}`)

  // Check each file for the field
  for (const file of FILES_TO_CHECK) {
    const filePath = resolve(clientLocation, file)
    if (!existsSync(filePath)) {
      console.log(`⏭️  File not found: ${file}`)
      continue
    }

    try {
      const content = readFileSync(filePath, 'utf-8')
      if (content.includes(FIELD_NAME)) {
        foundField = true
        console.log(`✅ Found ${FIELD_NAME} in ${file}`)
        break
      } else {
        console.log(`❌ ${FIELD_NAME} NOT found in ${file}`)
      }
    } catch (error) {
      console.error(`⚠️  Error reading ${file}:`, error.message)
    }
  }

  if (foundField) {
    break
  }
}

if (!foundClient) {
  console.error('❌ ERROR: Prisma client not found in any expected location!')
  console.error('   Expected locations:')
  PRISMA_CLIENT_LOCATIONS.forEach(loc => console.error(`   - ${loc}`))
  process.exit(1)
}

if (!foundField) {
  console.error(`❌ ERROR: Field '${FIELD_NAME}' NOT found in Prisma client!`)
  console.error(`   Checked location: ${checkedLocation}`)
  console.error('   This means Prisma client was not regenerated correctly.')
  console.error('   Please ensure:')
  console.error('   1. The field exists in packages/prisma/schema.prisma')
  console.error('   2. Prisma client is regenerated with: cd packages/prisma && npm run generate')
  console.error('   3. The generated client is copied to the correct location')
  process.exit(1)
}

console.log('✅ Verification passed: paymentReturnHomeUrl field is present in Prisma client')
process.exit(0)

