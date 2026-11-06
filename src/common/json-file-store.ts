import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** Remove as chaves com valor `undefined`, para o PATCH só alterar o que foi enviado. */
export function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/**
 * Guarda uma coleção em um arquivo JSON dentro de `data/` (ou de DATA_DIR, se definido).
 * Toda leitura vem do disco, e as escritas passam por uma fila para que
 * requisições simultâneas não sobrescrevam umas às outras.
 */
export class JsonFileStore<T extends { id: number }> {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly fileName: string) {}

  get filePath(): string {
    const dir = process.env.DATA_DIR ?? join(process.cwd(), 'data');
    return join(dir, this.fileName);
  }

  async readAll(): Promise<T[]> {
    try {
      const content = await readFile(this.filePath, 'utf-8');
      return content.trim() ? (JSON.parse(content) as T[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  /** Lê a coleção, aplica a alteração e grava de volta, tudo dentro da fila. */
  async mutate<R>(change: (items: T[]) => R): Promise<R> {
    const run = async () => {
      const items = await this.readAll();
      const result = change(items);
      await this.writeAll(items);
      return result;
    };
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => undefined);
    return next;
  }

  static nextId(items: { id: number }[]): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  /** Grava em um arquivo temporário e renomeia, para o JSON nunca ficar pela metade. */
  private async writeAll(items: T[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(items, null, 2) + '\n', 'utf-8');
    await rename(tmp, this.filePath);
  }
}
