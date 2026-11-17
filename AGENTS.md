# AGENTS.md

Guidance for AI coding agents working in this repository. Humans: see README.md.

## Project

Task management app in an npm workspaces monorepo:

- `apps/api`: REST API with NestJS 12 (ESM), TypeORM and PostgreSQL 18.
- `apps/web`: Angular 22 + Angular Material client (coming soon).

## Commands (run from the repository root)

| Task                        | Command                                       |
| --------------------------- | --------------------------------------------- |
| Install dependencies        | `npm install`                                 |
| Start PostgreSQL (Docker)   | `npm run db:up`                               |
| Run the API in watch mode   | `npm run dev:api`                             |
| Build / lint / unit tests   | `npm run build` · `npm run lint` · `npm test` |
| E2E tests (requires Docker) | `npm run test:e2e`                            |
| Format                      | `npm run format`                              |

A change is done when build, lint and all tests pass.

## Conventions

- TypeScript strict; `any` is a lint error. Prefer `as const` unions over `enum`.
- ESM: relative imports end in `.js` (`import { X } from './x.js'`).
- One module per feature; controller → service → repository. Input is validated with
  class-validator DTOs; responses use response DTOs, never entities.
- Read configuration only through `ConfigService<EnvironmentVariables, true>`, never
  `process.env`. New variables go in `src/config/env.validation.ts` and `.env.example`.
- Schema changes only through TypeORM migrations; never `synchronize: true`.
- Tests ship with the feature: unit tests next to the code (`*.spec.ts`), e2e tests in
  `apps/api/test`.

## Git

- Conventional Commits (enforced by commitlint); one small commit per step.
- Branch + pull request; merge with "Rebase and merge".
- No tool attribution trailers in commits or PR descriptions.

## Boundaries

- Never commit `.env` files or secrets.
- Ask before adding a new dependency.
- Never edit lockfiles by hand.
