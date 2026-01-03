import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

// Register module aliases for runtime path resolution
// This ensures require() calls can resolve @ipnuo/* paths
import 'module-alias/register'

// Last modified: 2025-11-25T15:05:00Z - Force rebuild for payment links CORS fix for CORS fix
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: true, // Enable body parser
  })

  // Increase body parser limit to 1MB (default is 100KB)
  // This fixes "PayloadTooLargeError: request entity too large" errors
  const bodyParser = require('body-parser')
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

  const configService = app.get(ConfigService)

  // Global prefix
  app.setGlobalPrefix('api/v1')

  // CORS configuration
  const isDevelopment = process.env.NODE_ENV !== 'production'
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'https://nextjs-one-pink-79.vercel.app',
  ]

  const configuredOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  // Combine configured origins with defaults
  const explicitOrigins = [...new Set([...defaultOrigins, ...configuredOrigins])]

  // In development, allow any localhost port via function
  // In production, allow explicit origins + any .vercel.app domain
  const originValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    console.log('[CORS] Validating origin:', origin)

    // Allow requests with no origin (same-origin or server-to-server requests)
    if (!origin) {
      console.log('[CORS] No origin provided, allowing (same-origin or server-side)')
      callback(null, true)
      return
    }

    // Check explicit origins first
    if (explicitOrigins.includes(origin)) {
      console.log('[CORS] Origin matches explicit list, accepting')
      callback(null, true)
      return
    }

    // In development, allow any localhost or 127.0.0.1 on any port
    if (isDevelopment) {
      const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
      if (localhostRegex.test(origin)) {
        console.log('[CORS] Origin matches localhost pattern (dev mode), accepting')
        callback(null, true)
        return
      }
    }

    // Allow any .vercel.app subdomain (for preview deployments)
    // Also allow railway.app domains for internal requests
    const vercelRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i
    const railwayRegex = /^https:\/\/.*\.railway\.app$/i
    if (vercelRegex.test(origin) || railwayRegex.test(origin)) {
      console.log('[CORS] Origin matches Vercel/Railway pattern, accepting:', origin)
      callback(null, true)
      return
    }

    console.log('[CORS] Origin does not match any pattern, rejecting')
    callback(null, false)
  }

  app.enableCors({
    origin: originValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Accept-Language',
      'Content-Language',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // Cache preflight for 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Railway automatically sets PORT environment variable
  // Use process.env.PORT first (Railway's default), then fallback to config
  const railwayPort = process.env.PORT
  const configuredPort = configService.get<string>('PORT')
  const portToUse = railwayPort || configuredPort || '3001'
  const parsedPort = Number.parseInt(portToUse, 10)
  const port = Number.isFinite(parsedPort) ? parsedPort : 3001
  const host = configService.get<string>('HOST') ?? process.env.HOST ?? '0.0.0.0'

  // Log port configuration for debugging
  console.log(`🔧 Port configuration:`, {
    railwayPort: process.env.PORT,
    configuredPort,
    finalPort: port,
    host,
  })

  await app.listen(port, host)

  // Use console.log to ensure logs appear in Railway
  console.log(`✅ Application is running on: http://${host}:${port}`)
  console.log(`✅ Global prefix: /api/v1`)
  const corsOriginsMessage = isDevelopment
    ? 'localhost:* (development mode)'
    : `${explicitOrigins.join(', ')}, *.vercel.app, *.railway.app`
  console.log(`✅ CORS enabled for origins: ${corsOriginsMessage}`)

  // Logger is available through NestJS app context
  try {
    const logger = (app as any).getLogger?.()
    if (logger && typeof logger.log === 'function') {
      logger.log(`✅ Application is running on: http://${host}:${port}`)
      logger.log(`✅ Global prefix: /api/v1`)
      logger.log(
        `✅ CORS enabled for origins: ${isDevelopment ? 'localhost:* (development mode)' : 'configured origins + *.vercel.app'}`,
      )
    }
  } catch (e) {
    // Ignore logger errors
  }
}

void bootstrap()
