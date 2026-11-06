# nest-tasks-api

API REST em NestJS com dois módulos, **Tasks** (tarefas) e **Books** (livros), cada um com
`GET`, `POST`, `PUT`, `PATCH` e `DELETE` e persistência em arquivo JSON.

## Como rodar

Requisitos: Node.js 22.12+ (ou 20.19+) e npm.

```bash
npm install
npm run start:dev
```

A API sobe em `http://localhost:3000`. Para outra porta, defina a variável `PORT`.

Para rodar a versão compilada:

```bash
npm run build
npm run start:prod
```

## Rotas

### Tasks

| Método | Rota         | Descrição                                                   |
| ------ | ------------ | ----------------------------------------------------------- |
| GET    | `/tasks`     | Lista todas. Filtro opcional: `?done=true` ou `?done=false` |
| GET    | `/tasks/:id` | Busca uma tarefa                                            |
| POST   | `/tasks`     | Cria uma tarefa (201)                                       |
| PUT    | `/tasks/:id` | Substitui a tarefa inteira                                  |
| PATCH  | `/tasks/:id` | Altera só os campos enviados                                |
| DELETE | `/tasks/:id` | Remove e devolve a tarefa removida                          |

| Campo         | Tipo    | Obrigatório | Padrão  |
| ------------- | ------- | ----------- | ------- |
| `title`       | string  | sim         |         |
| `description` | string  | não         | `""`    |
| `done`        | boolean | não         | `false` |

`id`, `createdAt` e `updatedAt` são preenchidos pelo servidor.

```json
{
  "id": 1,
  "title": "Estudar NestJS",
  "description": "Controllers e services",
  "done": false,
  "createdAt": "2026-11-06T13:06:16.787Z",
  "updatedAt": "2026-11-06T13:06:16.787Z"
}
```

### Books

| Método | Rota         | Descrição                                                 |
| ------ | ------------ | --------------------------------------------------------- |
| GET    | `/books`     | Lista todos. Filtro opcional por autor: `?author=machado` |
| GET    | `/books/:id` | Busca um livro                                            |
| POST   | `/books`     | Cria um livro (201)                                       |
| PUT    | `/books/:id` | Substitui o livro inteiro                                 |
| PATCH  | `/books/:id` | Altera só os campos enviados                              |
| DELETE | `/books/:id` | Remove e devolve o livro removido                         |

| Campo    | Tipo    | Obrigatório | Padrão  |
| -------- | ------- | ----------- | ------- |
| `title`  | string  | sim         |         |
| `author` | string  | sim         |         |
| `year`   | inteiro | não         | `null`  |
| `genre`  | string  | não         | `""`    |
| `read`   | boolean | não         | `false` |

### PUT e PATCH

- **PUT** recebe o recurso completo. Campos não enviados voltam ao valor padrão:
  `PUT /tasks/1 {"title":"Novo"}` deixa `description: ""` e `done: false`.
- **PATCH** recebe só o que muda e mantém o resto:
  `PATCH /tasks/1 {"done":true}` não altera título nem descrição.

### Erros

- `400`: corpo inválido (campo obrigatório ausente, tipo errado ou campo desconhecido) ou id não numérico.
- `404`: id inexistente.

## Persistência

Cada módulo grava em um arquivo próprio, `data/tasks.json` e `data/books.json`.
Como toda leitura é feita no arquivo, os dados continuam disponíveis depois de reiniciar o servidor.
A lógica fica em [`src/common/json-file-store.ts`](src/common/json-file-store.ts).

Os arquivos de dados não são versionados (`.gitignore`). Para usar outra pasta, defina `DATA_DIR`.

## Testes

```bash
npm run test:e2e
```

São 20 testes, 10 por módulo, cobrindo todas as rotas, validação, respostas 404,
o conteúdo gravado no JSON, requisições simultâneas e a permanência dos dados após reiniciar a aplicação.
Os testes usam uma pasta temporária e não alteram `data/`.

Para testes manuais, o arquivo [`requests.http`](requests.http) tem uma requisição para cada rota
(extensão REST Client do VS Code). Também dá para usar `curl`:

```bash
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Estudar NestJS"}'
curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d '{"done":true}'
curl http://localhost:3000/tasks
```

## Estrutura

```
src/
├── common/json-file-store.ts   leitura e gravação em JSON
├── tasks/
│   ├── dto/                    CreateTaskDto (POST e PUT), UpdateTaskDto (PATCH)
│   ├── task.entity.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.module.ts
├── books/                      mesma estrutura de tasks
├── app.controller.ts           GET / com a lista de recursos
├── app.module.ts
├── setup-app.ts                validação global e CORS
└── main.ts
test/
├── tasks.e2e-spec.ts
├── books.e2e-spec.ts
└── helpers.ts
requests.http                   requisições prontas para teste manual
```

## Observação

O arquivo `.npmrc` define `legacy-peer-deps=true`. Sem ele, algumas versões do npm falham no
`npm install` com o erro `Cannot read properties of null (reading 'edgesOut')`.
