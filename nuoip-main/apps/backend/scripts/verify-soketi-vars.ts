/**
 * Script to verify Soketi environment variables are accessible
 * Run this in Railway to verify the variables are available
 */

const requiredVars = [
  'SOKETI_APP_ID',
  'SOKETI_DEFAULT_APP_ID',
  'SOKETI_APP_KEY',
  'SOKETI_DEFAULT_APP_KEY',
  'SOKETI_APP_SECRET',
  'SOKETI_DEFAULT_APP_SECRET',
  'SOKETI_HOST',
  'SOKETI_INTERNAL_HOST',
  'SOKETI_PUBLIC_HOST',
]

const optionalVars = [
  'SOKETI_PORT',
  'SOKETI_INTERNAL_PORT',
  'SOKETI_PUBLIC_PORT',
  'SOKETI_USE_TLS',
]

console.log('🔍 Checking Soketi environment variables...\n')

// Check required variables (at least one variant must exist)
const appId = process.env.SOKETI_APP_ID || process.env.SOKETI_DEFAULT_APP_ID
const appKey = process.env.SOKETI_APP_KEY || process.env.SOKETI_DEFAULT_APP_KEY
const appSecret = process.env.SOKETI_APP_SECRET || process.env.SOKETI_DEFAULT_APP_SECRET
const host = process.env.SOKETI_INTERNAL_HOST || process.env.SOKETI_HOST || process.env.SOKETI_PUBLIC_HOST

console.log('Required variables:')
console.log(`  SOKETI_APP_ID: ${process.env.SOKETI_APP_ID || '❌ not set'}`)
console.log(`  SOKETI_DEFAULT_APP_ID: ${process.env.SOKETI_DEFAULT_APP_ID || '❌ not set'}`)
console.log(`  → Resolved: ${appId || '❌ MISSING'}`)
console.log('')

console.log(`  SOKETI_APP_KEY: ${process.env.SOKETI_APP_KEY ? '✅ set' : '❌ not set'}`)
console.log(`  SOKETI_DEFAULT_APP_KEY: ${process.env.SOKETI_DEFAULT_APP_KEY ? '✅ set' : '❌ not set'}`)
console.log(`  → Resolved: ${appKey ? '✅ FOUND' : '❌ MISSING'}`)
console.log('')

console.log(`  SOKETI_APP_SECRET: ${process.env.SOKETI_APP_SECRET ? '✅ set' : '❌ not set'}`)
console.log(`  SOKETI_DEFAULT_APP_SECRET: ${process.env.SOKETI_DEFAULT_APP_SECRET ? '✅ set' : '❌ not set'}`)
console.log(`  → Resolved: ${appSecret ? '✅ FOUND' : '❌ MISSING'}`)
console.log('')

console.log(`  SOKETI_INTERNAL_HOST: ${process.env.SOKETI_INTERNAL_HOST || '❌ not set'}`)
console.log(`  SOKETI_HOST: ${process.env.SOKETI_HOST || '❌ not set'}`)
console.log(`  SOKETI_PUBLIC_HOST: ${process.env.SOKETI_PUBLIC_HOST || '❌ not set'}`)
console.log(`  → Resolved: ${host || '❌ MISSING'}`)
console.log('')

console.log('Optional variables:')
console.log(`  SOKETI_INTERNAL_PORT: ${process.env.SOKETI_INTERNAL_PORT || 'not set (default: 443)'}`)
console.log(`  SOKETI_PORT: ${process.env.SOKETI_PORT || 'not set'}`)
console.log(`  SOKETI_PUBLIC_PORT: ${process.env.SOKETI_PUBLIC_PORT || 'not set'}`)
console.log(`  SOKETI_USE_TLS: ${process.env.SOKETI_USE_TLS || 'not set (default: true)'}`)
console.log('')

// Final check
if (appId && appKey && appSecret && host) {
  console.log('✅ ✅ ✅ ALL REQUIRED VARIABLES FOUND ✅ ✅ ✅')
  console.log('')
  console.log('Configuration:')
  console.log(`  App ID: ${appId}`)
  console.log(`  App Key: ${appKey.substring(0, 10)}...`)
  console.log(`  App Secret: ${appSecret.substring(0, 10)}...`)
  console.log(`  Host: ${host}`)
  console.log(`  Port: ${process.env.SOKETI_INTERNAL_PORT || process.env.SOKETI_PORT || process.env.SOKETI_PUBLIC_PORT || '443'}`)
  console.log(`  Use TLS: ${process.env.SOKETI_USE_TLS !== 'false'}`)
  process.exit(0)
} else {
  console.log('❌ ❌ ❌ MISSING REQUIRED VARIABLES ❌ ❌ ❌')
  console.log('')
  if (!appId) console.log('  ❌ App ID is missing')
  if (!appKey) console.log('  ❌ App Key is missing')
  if (!appSecret) console.log('  ❌ App Secret is missing')
  if (!host) console.log('  ❌ Host is missing')
  console.log('')
  console.log('Please configure the shared variables in Railway Project Settings')
  process.exit(1)
}

