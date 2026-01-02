import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = Number.parseInt(process.env.PORT ?? '3002', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`ZKey Service is running on: ${await app.getUrl()}`);
}
void bootstrap();
