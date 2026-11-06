import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { startApp, useTempDataDir } from './helpers.js';

describe('Tasks (e2e)', () => {
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

  it('GET /tasks começa vazio', async () => {
    await api().get('/tasks').expect(200).expect([]);
  });

  it('POST /tasks cria tarefas com valores padrão', async () => {
    const res = await api()
      .post('/tasks')
      .send({ title: 'Estudar NestJS', description: 'Módulos' })
      .expect(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Estudar NestJS',
      description: 'Módulos',
      done: false,
    });
    expect(res.body.createdAt).toBeDefined();

    const res2 = await api()
      .post('/tasks')
      .send({ title: 'Segunda' })
      .expect(201);
    expect(res2.body).toMatchObject({ id: 2, description: '', done: false });
  });

  it('POST /tasks valida o corpo', async () => {
    await api().post('/tasks').send({}).expect(400);
    await api().post('/tasks').send({ title: '' }).expect(400);
    await api().post('/tasks').send({ title: 'x', done: 'sim' }).expect(400);
    await api().post('/tasks').send({ title: 'x', extra: 1 }).expect(400);
  });

  it('GET /tasks/:id', async () => {
    const res = await api().get('/tasks/1').expect(200);
    expect(res.body.title).toBe('Estudar NestJS');
    await api().get('/tasks/999').expect(404);
    await api().get('/tasks/abc').expect(400);
  });

  it('PATCH /tasks/:id altera só os campos enviados', async () => {
    const res = await api().patch('/tasks/1').send({ done: true }).expect(200);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Estudar NestJS',
      description: 'Módulos',
      done: true,
    });
    await api().patch('/tasks/999').send({ done: true }).expect(404);
  });

  it('PUT /tasks/:id substitui a tarefa inteira', async () => {
    const res = await api()
      .put('/tasks/1')
      .send({ title: 'Novo título' })
      .expect(200);
    // description e done não foram enviados: voltam ao padrão
    expect(res.body).toMatchObject({
      id: 1,
      title: 'Novo título',
      description: '',
      done: false,
    });
    await api().put('/tasks/1').send({ done: true }).expect(400); // falta title
    await api().put('/tasks/999').send({ title: 'x' }).expect(404);
  });

  it('GET /tasks?done= filtra por status', async () => {
    await api().patch('/tasks/2').send({ done: true }).expect(200);
    const res = await api().get('/tasks?done=true').expect(200);
    expect(res.body.map((t: { id: number }) => t.id)).toEqual([2]);
  });

  it('DELETE /tasks/:id', async () => {
    const res = await api().delete('/tasks/2').expect(200);
    expect(res.body.id).toBe(2);
    await api().get('/tasks/2').expect(404);
    await api().delete('/tasks/2').expect(404);
  });

  it('grava as tarefas em tasks.json', async () => {
    const file = join(process.env.DATA_DIR!, 'tasks.json');
    const saved = JSON.parse(await readFile(file, 'utf-8'));
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('Novo título');
  });

  it('mantém os dados depois de reiniciar o servidor', async () => {
    await app.close();
    app = await startApp();
    const res = await api().get('/tasks').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 1, title: 'Novo título' });
    // e o próximo id continua a sequência
    const created = await api()
      .post('/tasks')
      .send({ title: 'Depois' })
      .expect(201);
    expect(created.body.id).toBe(2);
  });
});
