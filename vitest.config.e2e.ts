import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // cada arquivo de teste troca DATA_DIR, então rodam um por vez
    fileParallelism: false,
  },
});
