/**
 * Webpack configuration for NestJS to fix path aliases in compiled output
 * This ensures @ipnuo/* imports are resolved to explicit file paths
 */
const path = require('path')

module.exports = function (options, webpack) {
  return {
    ...options,
    plugins: [
      ...options.plugins,
      // Custom plugin to fix require paths after compilation
      new webpack.DefinePlugin({
        // This doesn't help with require() paths, but we'll use a different approach
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        '@ipnuo/shared-chat-auth': path.resolve(__dirname, '../../packages/shared-chat-auth/src/index.ts'),
        '@ipnuo/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
        '@ipnuo/prisma': path.resolve(__dirname, '../../packages/prisma/src/index.ts'),
      },
    },
  }
}

