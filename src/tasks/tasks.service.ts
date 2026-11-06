import { Injectable, NotFoundException } from '@nestjs/common';
import { definedOnly, JsonFileStore } from '../common/json-file-store.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './task.entity.js';

@Injectable()
export class TasksService {
  private readonly store = new JsonFileStore<Task>('tasks.json');

  async findAll(done?: boolean): Promise<Task[]> {
    const tasks = await this.store.readAll();
    return done === undefined ? tasks : tasks.filter((t) => t.done === done);
  }

  async findOne(id: number): Promise<Task> {
    const tasks = await this.store.readAll();
    const task = tasks.find((t) => t.id === id);
    if (!task) throw new NotFoundException(`Tarefa ${id} não encontrada`);
    return task;
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.store.mutate((tasks) => {
      const now = new Date().toISOString();
      const task: Task = {
        id: JsonFileStore.nextId(tasks),
        title: dto.title,
        description: dto.description ?? '',
        done: dto.done ?? false,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      return task;
    });
  }

  /** PUT: substitui a tarefa inteira. Campos não enviados voltam ao padrão. */
  replace(id: number, dto: CreateTaskDto): Promise<Task> {
    return this.store.mutate((tasks) => {
      const index = this.indexOrFail(tasks, id);
      const task: Task = {
        id,
        title: dto.title,
        description: dto.description ?? '',
        done: dto.done ?? false,
        createdAt: tasks[index].createdAt,
        updatedAt: new Date().toISOString(),
      };
      tasks[index] = task;
      return task;
    });
  }

  /** PATCH: altera apenas os campos enviados. */
  update(id: number, dto: UpdateTaskDto): Promise<Task> {
    return this.store.mutate((tasks) => {
      const index = this.indexOrFail(tasks, id);
      const task: Task = {
        ...tasks[index],
        ...definedOnly(dto),
        id,
        updatedAt: new Date().toISOString(),
      };
      tasks[index] = task;
      return task;
    });
  }

  remove(id: number): Promise<Task> {
    return this.store.mutate((tasks) => {
      const index = this.indexOrFail(tasks, id);
      const [removed] = tasks.splice(index, 1);
      return removed;
    });
  }

  private indexOrFail(tasks: Task[], id: number): number {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1)
      throw new NotFoundException(`Tarefa ${id} não encontrada`);
    return index;
  }
}
