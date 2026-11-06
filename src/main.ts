import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = setupApp(await NestFactory.create(AppModule));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
}
await bootstrap();
