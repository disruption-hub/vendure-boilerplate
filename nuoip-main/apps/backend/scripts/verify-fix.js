/**
 * Verification script to check if fix-requires.js worked
 * This will fail the build if paths are not fixed correctly
 */
const fs = require('fs')
const path = require('path')
const { globSync } = require('glob')

const distDir = path.join(__dirname, '../dist')

if (!fs.existsSync(distDir)) {
  console.error(`ERROR: dist directory not found at ${distDir}`)
  process.exit(1)
}

// Find all .js files in dist
const files = globSync('**/*.js', { cwd: distDir, absolute: true })

let foundUnfixed = false
const unfixedFiles = []

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8')
  
  // Check for unfixed paths (directory paths without /index.ts)
  const unfixedPattern = /require\((["'])([^"']*packages\/(shared-chat-auth|domain|prisma)\/src)\1\)/g
  const matches = content.match(unfixedPattern)
  
  if (matches && matches.length > 0) {
    foundUnfixed = true
    unfixedFiles.push({
      file: path.relative(distDir, file),
      matches: matches.slice(0, 3) // Show first 3 matches
    })
  }
})

if (foundUnfixed) {
  console.error('❌ VERIFICATION FAILED: Found unfixed require paths!')
  console.error('The following files still have directory requires:')
  unfixedFiles.forEach(({ file, matches }) => {
    console.error(`  - ${file}:`)
    matches.forEach(match => console.error(`    ${match}`))
  })
  console.error('\nThe fix-requires.js script may not have run or may not be matching correctly.')
  process.exit(1)
} else {
  console.log('✅ VERIFICATION PASSED: All require paths are fixed correctly')
}

