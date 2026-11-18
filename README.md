# Tasks API

A REST API to manage tasks, built with **NestJS 12**, **PostgreSQL 18** and **TypeORM**. A task has
a title, a description, a status (`pending`, `in_progress` or `done`), an assignee and a due date;
the list can be filtered by status and assignee, and it is paginated.

The challenge asked for the backend. As extras, the repository also has a web client (Angular 22
and Angular Material) and a Docker setup that runs the whole app as in production with one
command.

## Contents

- [Quick start](#quick-start)
- [API](#api)
- [Configuration](#configuration)
- [Tests](#tests)
- [How I used AI](#how-i-used-ai)
- [With more time](#with-more-time)
- [Other considerations](#other-considerations)

## Quick start

### With Docker: one command

Requirements: Docker with Compose v2.

```bash
docker compose --profile app up --build --wait
```

| URL                                | What                       |
| ---------------------------------- | -------------------------- |
| http://localhost:8080              | Web app                    |
| http://localhost:8080/api/v1/tasks | API                        |
| http://localhost:8080/api/docs     | API docs (OpenAPI/Swagger) |

The first build downloads the base images and every dependency, so it takes a few minutes. It
starts PostgreSQL, applies the migrations, loads 48 demo tasks (three pages, to try the filters
and the paginator; only into an empty database), then starts the API and nginx (which serves the
web app and forwards `/api` to the API). Stop it with `docker compose --profile app down` (add
`--volumes` to delete the data and start over with the demo tasks). With Node.js installed, `npm run app:up` and `npm run app:down`
do the same.

### For development

Requirements: Node.js 24.15 or later (see `.nvmrc`) with its bundled npm 11, and Docker (for
PostgreSQL and the end-to-end tests).

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run db:up           # PostgreSQL 18 on localhost:5432
npm run migration:run
npm run db:seed         # optional: the 48 demo tasks, if the database is empty
npm run dev:api         # API on http://localhost:3000, restarts on changes
npm run dev:web         # optional: web app on http://localhost:4200
```

The API docs are at http://localhost:3000/api/docs. [`apps/api/tasks.http`](apps/api/tasks.http)
has a request for every endpoint, ready to send with the VS Code REST Client extension.

## API

JSON over HTTP under `/api/v1`, on port 3000 in development and 8080 with Docker. The full
reference, with every field, rule and response, is the OpenAPI document at `/api/docs` (JSON at
`/api/docs-json`).

| Method   | Path                 | What it does                         | Success             | Errors   |
| -------- | -------------------- | ------------------------------------ | ------------------- | -------- |
| `GET`    | `/api/v1/tasks`      | Lists tasks, filtered and paged      | 200                 | 400      |
| `POST`   | `/api/v1/tasks`      | Creates a task                       | 201 with `Location` | 400      |
| `GET`    | `/api/v1/tasks/{id}` | Returns a task                       | 200                 | 400, 404 |
| `PATCH`  | `/api/v1/tasks/{id}` | Changes some fields of a task        | 200                 | 400, 404 |
| `DELETE` | `/api/v1/tasks/{id}` | Deletes a task                       | 204                 | 400, 404 |
| `GET`    | `/api/health/live`   | Liveness: the process is running     | 200                 |          |
| `GET`    | `/api/health/ready`  | Readiness: the database is reachable | 200                 | 503      |

Any request may also get a 429 (rate limit) or a 500 (unexpected error).

### Good to know

- **Rate limit:** 100 requests per minute per client IP by default (`RATE_LIMIT_*`), reported in
  the `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers. Health
  checks are exempt.
- **Request ids:** every response has an `X-Request-Id`. A client can send its own (letters,
  digits, `-` and `_`, up to 128 characters) to follow a request through the logs; anything else
  is replaced.
- **CORS** is off: the web app reaches the API from the same origin (the Angular dev server and
  nginx forward `/api`). Other origins can be allowed with `CORS_ORIGINS`.

## Configuration

The API reads environment variables, from `apps/api/.env` in development. They are validated at
startup: a missing or invalid value stops the API with a message that names the variable, never
its value.

| Variable                                | Default             | What it does                                                      |
| --------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| `NODE_ENV`                              | `development`       | `development` (readable logs), `production` or `test` (JSON logs) |
| `PORT`                                  | `3000`              | HTTP port                                                         |
| `LOG_LEVEL`                             | `info`              | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent`    |
| `SWAGGER_ENABLED`                       | `true`              | Serves the API docs at `/api/docs`                                |
| `CORS_ORIGINS`                          | empty (off)         | Comma-separated origins allowed to call the API from a browser    |
| `RATE_LIMIT_REQUESTS`                   | `100`               | Requests per client IP and window                                 |
| `RATE_LIMIT_WINDOW_SECONDS`             | `60`                | Length of the window                                              |
| `TRUST_PROXY_HOPS`                      | `0`                 | Reverse proxies in front of the API (1 behind nginx)              |
| `DB_HOST`, `DB_PORT`                    | `localhost`, `5432` | PostgreSQL server                                                 |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | none, required      | PostgreSQL credentials and database                               |

`compose.yaml` needs no configuration. To change its defaults, copy `.env.example` to `.env` at
the root: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, and for the
Docker app `WEB_PORT`, `LOG_LEVEL` and `SWAGGER_ENABLED`.

## Tests

| Command            | What runs                                                        | Tests    |
| ------------------ | ---------------------------------------------------------------- | -------- |
| `npm test`         | Unit tests of the API and the web app (Vitest)                   | 175 + 84 |
| `npm run test:e2e` | API end-to-end tests against a real PostgreSQL 18 (needs Docker) | 78       |

`npm run build`, `npm run lint` and `npm run format:check` complete the checks; a change is done
when all of them pass.

What the API tests cover:

- **End to end**, through the real HTTP stack (the tests build the app with the same setup as
  production) and a disposable PostgreSQL started by Testcontainers:
  - every endpoint and status code, including JSON Merge Patch and the validation errors;
  - the migrations: exact schema, in sync with the entities, full revert and re-apply, and the
    constraints enforced by the database;
  - the query plans: `EXPLAIN` shows that every list query reads its page from an index,
    without sorting;
  - security headers, CORS, the rate limit (including a forged `X-Forwarded-For`), request ids,
    health checks and the OpenAPI document;
  - the demo seed: it fills an empty database and leaves one that has tasks untouched.
- **Unit:** validation rules of the DTOs, the service, the Problem Details filter, pagination,
  configuration, log redaction, request ids, CORS, the database naming strategy and the demo
  data.

The web app's tests use Angular Material's component harnesses and Angular's HTTP testing tools.

## How I used AI

AI was used throughout the workflow, which allowed greater speed and quality in the solution. I
first used it to analyze the problem and review my proposed stack and architecture. Since I had
already defined the technology stack, the monorepo decision, a clear idea of the project structure
I wanted, the main entity, PostgreSQL, everything about Docker, tests... I relied on the AI to
validate the possible solution and architecture, verify the stable versions of those
technologies and the state of the NestJS ORMs, and make sure I was not leaving anything out of the
model and the entity. Early on, it helped me create a concrete plan for the development and the
implementation.

Then I used it for the initial scaffolding, to check that everything worked well and that there
were no problems or incompatibilities between the library versions. After that I used it for the
coding, guiding it throughout the process so that it followed good practices and patterns and,
even though it was a small project, followed industry standards. I gained a lot of speed: the AI
took care of 100% of the tests, all the documentation, the commit messages and the PR
descriptions.

For the most part my role was that of a reviewer: I already knew very clearly what I wanted and
the standards and good practices we had to meet, and I supervised the order and quality of the
process.

I did decide and correct some things, above all to avoid overengineering a simple project. These
are some of those decisions:

- Not using Nx for the monorepo.
- npm workspaces over pnpm.
- Not building the `User` entity and its whole CRUD, since it was not needed for the solution.
- Using TypeORM rather than Prisma, to follow NestJS's official option.
- Not setting up CI or browser tests for the frontend.
- I changed the proposed order to work on the frontend first, before fully defining the Docker
  setup (API + web with nginx, the whole stack at once).
- The frontend UI in English.

## With more time

With more time to devote to supervision and the work, I would have:

- worked more on the concept of a user: created the entity, its CRUD, a seed and perhaps the
  autocomplete;
- implemented authentication and improved security, perhaps also dealing with permissions and
  roles;
- optimized pagination with a cursor;
- completed the CI on GitHub and tested more with Playwright.

## Other considerations

- I built a small frontend only as an extra, to test the application visually, check that it
  behaved correctly and deliver it in a way that lets the API be tried as close to reality as
  possible. I spent no more time on it than the initial definition and what I used for testing.
- The AI I used was the Claude Code harness with Opus 5.5 at xhigh effort.
