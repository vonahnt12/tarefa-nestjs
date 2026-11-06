import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

/** Sobe a aplicação completa (igual ao main.ts) em uma porta livre qualquer. */
export async function startApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = setupApp(
    moduleRef.createNestApplication(),
  ) as INestApplication<App>;
  await app.listen(0);
  return app;
}

/** Aponta DATA_DIR para uma pasta temporária, para não mexer em data/. */
export async function useTempDataDir(): Promise<{
  cleanup: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'nest-tasks-api-'));
  const previous = process.env.DATA_DIR;
  process.env.DATA_DIR = dir;
  return {
    cleanup: async () => {
      if (previous === undefined) delete process.env.DATA_DIR;
      else process.env.DATA_DIR = previous;
      await rm(dir, { recursive: true, force: true });
    },
  };
}
