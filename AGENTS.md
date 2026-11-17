# AGENTS.md

Guidance for AI coding agents working in this repository. Humans: see README.md.

## Project

Task management app in an npm workspaces monorepo:

- `apps/api`: REST API with NestJS 12 (ESM), TypeORM and PostgreSQL 18.
- `apps/web`: single-page client with Angular 22 and Angular Material; its own conventions are
  in `apps/web/AGENTS.md`.

## Commands (run from the repository root)

| Task                        | Command                                              |
| --------------------------- | ---------------------------------------------------- |
| Install dependencies        | `npm install`                                        |
| Local API settings (once)   | copy `apps/api/.env.example` to `apps/api/.env`      |
| Start PostgreSQL (Docker)   | `npm run db:up`                                      |
| Apply / revert migrations   | `npm run migration:run` · `npm run migration:revert` |
| Run the API in watch mode   | `npm run dev:api`                                    |
| Run the web app (port 4200) | `npm run dev:web` (proxies `/api` to the API)        |
| Build / lint / unit tests   | `npm run build` · `npm run lint` · `npm test`        |
| E2E tests (requires Docker) | `npm run test:e2e`                                   |
| Whole app in Docker (8080)  | `npm run app:up` · `npm run app:logs` · `app:down`   |
| Format                      | `npm run format`                                     |

A change is done when build, lint and all tests pass, for both apps.

## API conventions (`apps/api`)

- TypeScript strict; `any` is a lint error. Prefer `as const` unions over `enum`.
- ESM: relative imports end in `.js` (`import { X } from './x.js'`).
- Routes are served under `/api/v1` (global prefix + URI versioning in `src/app.setup.ts`).
  OpenAPI docs at `/api/docs`; document DTOs with JSDoc comments (Swagger CLI plugin).
- One module per feature; controller → service → repository (a class wrapping TypeORM's
  `Repository`, so services never use TypeORM directly). Input is validated with
  class-validator DTOs (unknown properties are rejected; conversions are explicit with
  `@Type`/`@Transform`); controllers map entities to response DTOs, never return entities.
- `PATCH` uses JSON Merge Patch semantics: absent fields stay unchanged, `null` clears an
  optional field. Build update DTOs with `PartialType(CreateDto, { skipNullProperties: false })`
  and mark optional fields stored in NOT NULL columns with `@IsOptionalNonNullable()`
  (`@IsOptional()` lets `null` through).
- Lists are paginated: the query DTO extends `PageQueryDto` (`page` starts at 1, `pageSize`
  is at most 100) and the response, a subclass of `PageResponseDto`, is
  `{ items, page, pageSize, totalItems, totalPages }`. Order by a unique column last so pages
  are stable.
- Errors: throw Nest `HttpException`s (`NotFoundException`, …) with a clear, client-safe
  message; the global `ProblemDetailsFilter` renders RFC 9457 Problem Details
  (`application/problem+json`, with `requestId` and field `errors` for validation). Never
  build error responses by hand; any other error becomes a generic 500 and is logged.
  Document each error response with `@ApiProblem(status, description)`.
- Security headers come from helmet in `configureApp()`: API responses get a CSP that forbids
  everything (`default-src 'none'`); only the Swagger UI path gets helmet's default CSP.
  CORS is off unless `CORS_ORIGINS` lists origins (an allowlist, never `*`); a response header
  a browser client must read goes in `CORS_EXPOSED_HEADERS` (`src/security/cors.ts`).
  A global rate limit per client IP answers 429 with `Retry-After` (`RATE_LIMIT_*`);
  infrastructure endpoints (health checks) opt out with `@SkipThrottle()`. Behind a reverse
  proxy, set `TRUST_PROXY_HOPS` so the client IP comes from `X-Forwarded-For`.
- Health checks (`src/health`, terminus) are not versioned: `/api/health/live` checks no
  dependency (liveness: restarting would not fix an outage) and `/api/health/ready` checks
  them (readiness: 503 when one is down). A new dependency adds its indicator to `ready`
  only. Health requests are left out of the request log.
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
- Schema: primary keys are UUIDv7 generated by PostgreSQL (`default: () => 'uuidv7()'`);
  closed sets of values are `varchar` + a named `CHECK` (not native enums); constraints are
  named explicitly (`PK_<table>`, `CHK_<table>_<column>`, `IDX_<table>_<columns>`); timestamps
  are `timestamptz`. Index what lists filter and sort by. Expression indexes (e.g.
  `lower(column)`) are written by hand in the migration and declared on the entity with
  `@Index(name, { synchronize: false })`, so the schema sync does not drop them.
- Tests ship with the feature: unit tests next to the code (`*.spec.ts`), e2e tests in
  `apps/api/test`. E2E tests build the app with `createTestApp()` (`test/utils`), which
  applies the same `configureApp()` as `main.ts`, and run against a disposable PostgreSQL
  container started once per run by Testcontainers (`test/setup`). E2E files share that
  database and run one after another; clean up the rows a test creates.

## Docker

- `compose.yaml` runs PostgreSQL alone (`npm run db:up`, for development) or, with the `app`
  profile (`npm run app:up`), the whole app built as for production on http://localhost:8080:
  `migrate` applies the migrations and exits, then `api` starts, then `web` (nginx serves the
  Angular build and forwards `/api` to the API). Only the web port is published, on localhost.
- Each app has its image (`apps/<app>/Dockerfile`), built from the repository root.
  `.dockerignore` is an allowlist: a file an image needs must be added to it. Base images are
  pinned by version and digest; update both together.
- Containers run as non-root users, with a read-only file system (only `/tmp` is writable) and
  no Linux capabilities. The API image has no npm: commands run `node` directly.
- nginx (`apps/web/nginx/`) sets the static files' headers, including a CSP with a new nonce
  per response; API responses keep the API's own headers.

## Git

- Conventional Commits (enforced by commitlint); one small commit per step.
- Branch + pull request; merge with "Rebase and merge".
- No tool attribution trailers in commits or PR descriptions.

## Boundaries

- Never commit `.env` files or secrets.
- Ask before adding a new dependency. Install scripts are opt-in: review new ones with
  `npm install-scripts ls` and record the decision in `allowScripts` (root `package.json`).
- npm installs only versions published at least 7 days ago (`min-release-age` in `.npmrc`).
  An urgent fix that cannot wait goes in `min-release-age-exclude`, with the reason in the
  commit message.
- Never edit lockfiles by hand.
