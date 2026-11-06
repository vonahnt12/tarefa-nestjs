import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuração compartilhada entre o servidor (main.ts) e os testes e2e. */
export function setupApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();
  return app;
}
