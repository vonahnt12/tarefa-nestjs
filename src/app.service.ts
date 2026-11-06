import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'nest-tasks-api',
      resources: ['/tasks', '/books'],
    };
  }
}
