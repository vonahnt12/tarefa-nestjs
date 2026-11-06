import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { startApp, useTempDataDir } from './helpers.js';

describe('Books (e2e)', () => {
  let app: INestApplication<App>;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ cleanup } = await useTempDataDir());
    app = await startApp();
  });

  afterAll(async () => {
    await app?.close();
    await cleanup();
  });

  const api = () => request(app.getHttpServer());

  it('GET /books começa vazio', async () => {
    await api().get('/books').expect(200).expect([]);
  });

  it('POST /books cria livros', async () => {
    const res = await api()
      .post('/books')
      .send({
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        year: 1899,
        genre: 'Romance',
      })
      .expect(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Dom Casmurro',
      author: 'Machado de Assis',
      year: 1899,
      genre: 'Romance',
      read: false,
    });

    const res2 = await api()
      .post('/books')
      .send({ title: 'O Tempo e o Vento', author: 'Erico Verissimo' })
      .expect(201);
    expect(res2.body).toMatchObject({
      id: 2,
      year: null,
      genre: '',
      read: false,
    });
  });

  it('POST /books valida o corpo', async () => {
    await api().post('/books').send({ title: 'Sem autor' }).expect(400);
    await api()
      .post('/books')
      .send({ title: 'x', author: 'y', year: 'abc' })
      .expect(400);
    await api()
      .post('/books')
      .send({ title: 'x', author: 'y', year: 1999.5 })
      .expect(400);
  });

  it('GET /books/:id e filtro por autor', async () => {
    const res = await api().get('/books/1').expect(200);
    expect(res.body.title).toBe('Dom Casmurro');
    await api().get('/books/999').expect(404);

    const filtered = await api().get('/books?author=erico').expect(200);
    expect(filtered.body.map((b: { id: number }) => b.id)).toEqual([2]);
  });

  it('PATCH /books/:id altera só os campos enviados', async () => {
    const res = await api().patch('/books/1').send({ read: true }).expect(200);
    expect(res.body).toMatchObject({
      title: 'Dom Casmurro',
      year: 1899,
      read: true,
    });
  });

  it('PUT /books/:id substitui o livro inteiro', async () => {
    const res = await api()
      .put('/books/1')
      .send({
        title: 'Memórias Póstumas de Brás Cubas',
        author: 'Machado de Assis',
      })
      .expect(200);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Memórias Póstumas de Brás Cubas',
      year: null,
      genre: '',
      read: false,
    });
    await api().put('/books/1').send({ title: 'Falta autor' }).expect(400);
    await api().put('/books/999').send({ title: 'x', author: 'y' }).expect(404);
  });

  it('DELETE /books/:id', async () => {
    await api().delete('/books/2').expect(200);
    await api().get('/books/2').expect(404);
  });

  it('não perde dados com várias requisições simultâneas', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        api()
          .post('/books')
          .send({ title: `Livro ${i}`, author: 'Autor' })
          .expect(201),
      ),
    );
    const res = await api().get('/books').expect(200);
    const ids = res.body.map((b: { id: number }) => b.id);
    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });

  it('grava os livros em books.json', async () => {
    const file = join(process.env.DATA_DIR!, 'books.json');
    const saved = JSON.parse(await readFile(file, 'utf-8'));
    expect(saved).toHaveLength(11);
  });

  it('mantém os dados depois de reiniciar o servidor', async () => {
    await app.close();
    app = await startApp();
    const res = await api().get('/books/1').expect(200);
    expect(res.body.title).toBe('Memórias Póstumas de Brás Cubas');
    const all = await api().get('/books').expect(200);
    expect(all.body).toHaveLength(11);
  });
});
