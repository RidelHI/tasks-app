# AGENTS.md (apps/web)

Angular 22 + Angular Material client for the Tasks API. The root `AGENTS.md` (commands, Git,
boundaries) applies too; this file adds what is specific to the web app.

## Commands (run from the repository root)

| Task                                 | Command                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Dev server (needs the API running)   | `npm run dev:web`, then open http://localhost:4200                                      |
| Build / lint / unit tests (web only) | `npm run build -w @tasks/web` · `npm run lint -w @tasks/web` · `npm test -w @tasks/web` |
| Unit tests in watch mode             | `npm run test:watch -w @tasks/web`                                                      |
| Generate code with the Angular CLI   | `npm run ng -w @tasks/web -- generate component tasks/task-form`                        |

## Angular

- Rely on the Angular 22 defaults instead of restating them: standalone components (no
  `standalone: true`), zoneless change detection and `OnPush` (no `changeDetection`).
- State lives in signals: `signal()`, `computed()`, `linkedSignal()`; update them with `set()` or
  `update()`. Components use `input()`, `output()` and `model()`, and put host bindings in the
  `host` object (no `@Input`, `@Output`, `@HostBinding` or `@HostListener`).
- Dependencies come from `inject()`, not constructor parameters. App-wide services use
  `@Service()`.
- Templates use the built-in control flow (`@if`, `@for` with `track`, `@switch`), `class` and
  `style` bindings (no `ngClass`, `ngStyle` or `CommonModule`; import only what the template
  uses) and keep logic in the component.
- Forms use Signal Forms (`@angular/forms/signals`).
- Each page is a lazy route (`loadComponent`) with a `title`; unknown URLs render `NotFoundPage`.
- Files follow the 2025 style guide (`tasks-page.ts`, no `.component` suffix) and are grouped by
  feature (`tasks/`, `not-found/`); app-wide providers live in `core/`. Imports have no file
  extension (bundler resolution), unlike the API.
- The API is called with relative URLs (`/api/v1/...`). The page and the API share an origin in
  development (`ng serve` proxies `/api` to http://localhost:3000, see `proxy.conf.json`) and
  in production (nginx), so the API keeps CORS off. API errors are RFC 9457 Problem Details
  (`application/problem+json`, validation errors listed per field in `errors`).

## UI

- Angular Material 3 components with the theme defined in `src/styles.scss` (`mat.theme`).
  Style with the system variables (`var(--mat-sys-*)`), never with hard-coded colors, so the light
  and dark modes (chosen by the operating system) both work; adjust a Material component with
  its `mat.<component>-overrides()` mixin.
- No third-party requests at runtime. Roboto comes from `@fontsource-variable/roboto`. Icons
  are SVG files in `public/icons/`, shown with `<mat-icon svgIcon="name">`: to add one, copy
  `outlined/<name>.svg` from the `@material-symbols/svg-400` npm package (version 0.48.3,
  Apache-2.0, license in `public/icons/LICENSE`).
- Accessibility: WCAG 2.2 AA. Every form control has a label, icon-only buttons have an
  `aria-label` and decorative icons stay hidden from assistive technology (the `mat-icon`
  default).
- User-facing text is in English.

## Tests and lint

- Unit tests sit next to the code (`*.spec.ts`) and run with Vitest + jsdom (`ng test`). Test
  through what the user or the caller sees: `RouterTestingHarness` for routes,
  `HttpTestingController` (`provideHttpClientTesting()`) for HTTP calls, Material component
  harnesses for Material components and `MatIconTestingModule` when a component shows icons.
- ESLint (angular-eslint, type-aware) includes the template accessibility rules; `any` and
  floating promises are errors and `console` is limited to `warn` and `error`.
