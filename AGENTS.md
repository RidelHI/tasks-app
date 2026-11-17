# AGENTS.md

Guidance for AI coding agents working in this repository. Humans: see README.md.

## Project

Task management app in an npm workspaces monorepo:

- `apps/api`: REST API with NestJS 12 (ESM), TypeORM and PostgreSQL 18.
- `apps/web`: Angular 22 + Angular Material client (coming soon).

## Commands (run from the repository root)

| Task                        | Command                                              |
| --------------------------- | ---------------------------------------------------- |
| Install dependencies        | `npm install`                                        |
| Local API settings (once)   | copy `apps/api/.env.example` to `apps/api/.env`      |
| Start PostgreSQL (Docker)   | `npm run db:up`                                      |
| Apply / revert migrations   | `npm run migration:run` · `npm run migration:revert` |
| Run the API in watch mode   | `npm run dev:api`                                    |
| Build / lint / unit tests   | `npm run build` · `npm run lint` · `npm test`        |
| E2E tests (requires Docker) | `npm run test:e2e`                                   |
| Format                      | `npm run format`                                     |

A change is done when build, lint and all tests pass.

## Conventions

- TypeScript strict; `any` is a lint error. Prefer `as const` unions over `enum`.
- ESM: relative imports end in `.js` (`import { X } from './x.js'`).
- Routes are served under `/api/v1` (global prefix + URI versioning in `src/app.setup.ts`).
  OpenAPI docs at `/api/docs`; document DTOs with JSDoc comments (Swagger CLI plugin).
- One module per feature; controller → service → repository. Input is validated with
  class-validator DTOs (unknown properties are rejected; conversions are explicit with
  `@Type`/`@Transform`); responses use response DTOs, never entities.
- Read configuration only through `ConfigService<EnvironmentVariables, true>`, never
  `process.env`. New variables go in `src/config/env.validation.ts` and `.env.example`.
- Log through `Logger` from `@nestjs/common` (`new Logger(MyClass.name)`); never
  `console.log`. Logs are JSON (pino) outside development and carry the request id.
- Database: columns are snake_case in PostgreSQL (`SnakeNamingStrategy`), camelCase in code.
  Entities and migrations are registered explicitly in `src/database/entities.ts` and
  `src/database/migrations/index.ts` (no globs). Schema changes only through migrations;
  never `synchronize: true`. Workflow: change the entity →
  `npm run migration:generate -w @tasks/api -- src/database/migrations/<Name>` → review the
  generated SQL → register the class → `npm run migration:run`.
- Tests ship with the feature: unit tests next to the code (`*.spec.ts`), e2e tests in
  `apps/api/test`. E2E tests build the app with `createTestApp()` (`test/utils`), which
  applies the same `configureApp()` as `main.ts`, and run against a disposable PostgreSQL
  container started once per run by Testcontainers (`test/setup`).

## Git

- Conventional Commits (enforced by commitlint); one small commit per step.
- Branch + pull request; merge with "Rebase and merge".
- No tool attribution trailers in commits or PR descriptions.

## Boundaries

- Never commit `.env` files or secrets.
- Ask before adding a new dependency. Install scripts are opt-in: review new ones with
  `npm install-scripts ls` and record the decision in `allowScripts` (root `package.json`).
- Never edit lockfiles by hand.
