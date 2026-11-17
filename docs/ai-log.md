# AI usage log

Running log of how an AI assistant (Claude Code) was used in this project. It feeds the
"How I used AI" section of the README. Each entry records what I **asked**, what I
**accepted** and what I **corrected or rejected**.

## 1. Architecture and working agreement

**Asked**

- Propose the architecture for a lightweight monorepo (no Nx): NestJS + PostgreSQL API and an
  Angular + Material client, on the latest stable versions.
- Work step by step: the AI proposes and explains the why and the alternatives, I approve,
  then it implements. Small Conventional Commits per step.
- Explain npm workspaces in depth, and what a "real" user/assignee model would require.

**Accepted**

- npm workspaces (`apps/api`, `apps/web`), no shared package between apps.
- TypeORM (Data Mapper) with explicit migrations; layered modules (controller → service →
  repository).
- Nest 12 defaults: ESM, Vitest, oxlint. TypeScript pinned to 6.0 per app (TS 7 is `latest`
  on npm but Angular 22 and Nest CLI 12 require 6.0) — detected by the AI from npm metadata.
- Cross-cutting baseline: validated config, `nestjs-pino`, RFC 9457 Problem Details,
  helmet/CORS/throttling, health checks, graceful shutdown, `/api/v1` versioning, Docker, CI.
- Assignee as a plain text field; a `User` entity and authentication are out of scope.

**Corrected / rejected**

- UI language: the AI proposed a Spanish UI; I changed it to English.
- Quality bar: I asked for industry-standard, production-grade practices even though the app is
  small, instead of a minimal setup.
- Testing: "at least 3 tests" is a floor, not a target. The AI's first roadmap left all tests
  for a final commit; it was reorganized so tests ship with each feature, and e2e tests moved
  from a shared Docker Compose database to Testcontainers (hermetic runs).
- Commit attribution: no AI co-author trailers in commits or PRs.
