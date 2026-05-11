import 'reflect-metadata';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(backendDir, '.env'),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 4000);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.setGlobalPrefix(process.env.API_PREFIX || 'api');
  app.enableCors({
    origin: frontendUrl.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(port, '0.0.0.0');
  console.log(`Backend API running on http://localhost:${port}/${process.env.API_PREFIX || 'api'}`);
}

bootstrap();
