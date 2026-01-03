/**
 * Post-build script to fix require paths for shared packages
 * TypeScript compiles @ipnuo/* aliases to directory paths, but Node.js needs explicit files
 * 
 * This script MUST run after nest build and MUST succeed, or the app will fail at runtime
 */
const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')

const distDir = path.join(__dirname, '../dist')

if (!fs.existsSync(distDir)) {
  console.error(`ERROR: dist directory not found at ${distDir}`)
  console.error('This script must run after nest build')
  process.exit(1)
}

// Find all .js files in dist
const files = globSync('**/*.js', { cwd: distDir, absolute: true })

console.log(`\n🔧 Fixing require paths in ${files.length} files...`)

let totalFixed = 0
let filesModified = 0

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8')
  const originalContent = content

  // Fix require paths for shared packages
  // Match patterns like: require("../../../packages/shared-chat-auth/src")
  // or require('../../../packages/shared-chat-auth/src')
  // and replace with: require("../../../packages/shared-chat-auth/src/index.ts")
  const patterns = [
    {
      name: 'shared-chat-auth',
      // Match both single and double quotes, with or without trailing slash
      // IMPORTANT: Must match the exact pattern from compiled output
      regex: /require\((["'])([^"']*packages\/shared-chat-auth\/src)\1\)/g,
      replacement: (match, quote, pkgPath) => {
        // Remove trailing slash if present, then add /index.ts
        const cleanPath = pkgPath.replace(/\/$/, '')
        return `require(${quote}${cleanPath}/index.ts${quote})`
      },
    },
    {
      name: 'domain',
      regex: /require\((["'])([^"']*packages\/domain\/src)\1\)/g,
      replacement: (match, quote, pkgPath) => {
        const cleanPath = pkgPath.replace(/\/$/, '')
        return `require(${quote}${cleanPath}/index.ts${quote})`
      },
    },
    {
      name: 'prisma',
      regex: /require\((["'])([^"']*packages\/prisma\/src)\1\)/g,
      replacement: (match, quote, pkgPath) => {
        const cleanPath = pkgPath.replace(/\/$/, '')
        return `require(${quote}${cleanPath}/index.ts${quote})`
      },
    },
    {
      name: 'prisma-generated-client',
      // Match Prisma 7 generated client paths: packages/prisma/generated/prisma/client
      // Ensure the path is correct and doesn't need /index.js appended (Prisma 7 handles this)
      regex: /require\((["'])([^"']*packages\/prisma\/generated\/prisma\/client)\1\)/g,
      replacement: (match, quote, pkgPath) => {
        // Prisma 7 client should work with the path as-is, but ensure no trailing issues
        const cleanPath = pkgPath.replace(/\/$/, '')
        // The path should work as-is, but we can verify it exists
        // If needed, we could add /index.js, but Prisma 7's package.json should handle this
        return `require(${quote}${cleanPath}${quote})`
      },
    },
  ]

  patterns.forEach(({ name, regex, replacement }) => {
    // Reset regex lastIndex to ensure we match all occurrences
    regex.lastIndex = 0
    const matches = content.match(regex)
    if (matches && matches.length > 0) {
      // Apply replacement
      content = content.replace(regex, replacement)
      console.log(`  ✅ Fixed ${matches.length} ${name} require(s) in: ${path.relative(distDir, file)}`)
      totalFixed += matches.length
    }
  })

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8')
    filesModified++
  }
})

if (totalFixed > 0) {
  console.log(`\n✅ Successfully fixed ${totalFixed} require path(s) in ${filesModified} file(s)`)
} else {
  console.log('\n⚠️  No require paths needed fixing')
  // Show a sample to help debug
  const sampleFile = files.find(f => f.includes('auth.service.js'))
  if (sampleFile) {
    const sample = fs.readFileSync(sampleFile, 'utf8')
    const match = sample.match(/require\(["'][^"']*packages\/shared-chat-auth[^"']*["']\)/)
    if (match) {
      console.log(`   Sample require found: ${match[0]}`)
      if (!match[0].includes('/index.ts')) {
        console.log(`   ❌ This should have been fixed - pattern may not match!`)
        console.log(`   Pattern should match: require("../../../packages/shared-chat-auth/src")`)
        process.exit(1)
      }
    }
  }
}

console.log('') // Empty line for readability
