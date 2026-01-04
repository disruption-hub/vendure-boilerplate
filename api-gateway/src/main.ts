import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  // Allow CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable body parsing for the GraphQL endpoint (required for Schema Stitching)
  app.use('/graphql', json({ limit: '5mb' }));

  // Proxy to Vendure Backend (Shop API)
  // VENDURE_SHOP_API_URL should be the base URL e.g. http://localhost:3000/shop-api
  const vendureUrl = configService.get<string>('VENDURE_SHOP_API_URL') || 'http://127.0.0.1:3000/shop-api';
  const vendureBase = vendureUrl.replace(/\/shop-api$/, '');

  // Proxy /shop-api
  app.use(
    createProxyMiddleware({
      target: vendureBase,
      changeOrigin: true,
      pathFilter: '/shop-api',
    }),
  );

  // Proxy /admin-api
  app.use(
    createProxyMiddleware({
      target: vendureBase,
      changeOrigin: true,
      pathFilter: '/admin-api',
    }),
  );

  // Proxy to ZKey Service
  const zkeyUrl = configService.get<string>('ZKEY_SERVICE_URL') || 'http://127.0.0.1:3002';
  app.use(
    createProxyMiddleware({
      target: zkeyUrl,
      changeOrigin: true,
      pathFilter: ['/auth/**', '/oauth/**', '/users/**'], // Match ZKey routes (added /users just in case)
    }),
  );

  // Proxy to Booking Service
  const bookingUrl = configService.get<string>('BOOKING_SERVICE_URL') || 'http://127.0.0.1:3005';
  app.use(
    createProxyMiddleware({
      target: bookingUrl,
      changeOrigin: true,
      pathFilter: ['/classes/**', '/bookings/**'],
    }),
  );

  await app.listen(configService.get<string>('PORT') || 3006);
}
bootstrap();
