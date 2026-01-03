/**
 * Runtime require hook to fix directory requires for shared packages
 * This intercepts require() calls and adds /index.ts to directory paths
 * 
 * MUST be imported FIRST in main.ts before any other imports
 */
const Module = require('module')
const { existsSync } = require('fs')
const { resolve, dirname } = require('path')

// Store original require
const originalRequire = Module.prototype.require

// Override require to handle directory requires
Module.prototype.require = function (id: string) {
  // Check if this is a relative path to a packages directory
  if (id.includes('packages/') && id.includes('/src') && !id.endsWith('.ts') && !id.endsWith('.js')) {
    // Try to resolve with /index.ts
    const possiblePaths = [
      `${id}/index.ts`,
      `${id}/index.js`,
      id,
    ]

    // Get the calling file's directory to resolve relative paths
    const callingFile = (this as any).filename || (require.main?.filename)
    const baseDir = callingFile ? dirname(callingFile) : process.cwd()

    for (const tryPath of possiblePaths) {
      try {
        // Resolve relative to the calling file
        const resolvedPath = resolve(baseDir, tryPath)
        if (existsSync(resolvedPath)) {
          return originalRequire.call(this, tryPath)
        }
      } catch (error) {
        // Continue to next path
      }
    }
  }

  // Fall back to original require
  return originalRequire.call(this, id)
}
