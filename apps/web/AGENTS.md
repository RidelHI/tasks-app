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
- Forms use Signal Forms (`@angular/forms/signals`), bound to Material controls with
  `[formField]`. The `submission` action returns the server's validation errors as field errors
  (`kind: 'server'`), so they show under their field, and `onInvalid` focuses the first invalid
  field. Errors raised by a control's own validator (e.g. the datepicker's `matDatepickerParse`)
  have no message: give them one in the form's `CONTROL_ERROR_MESSAGES`.
- Each page is a lazy route (`loadComponent`) with a `title`; unknown URLs render `NotFoundPage`.
- Files follow the 2025 style guide (`tasks-page.ts`, no `.component` suffix) and are grouped by
  feature (`tasks/`, `not-found/`); app-wide providers and helpers live in `core/`, components
  shared by features in `shared/` and test helpers in a feature's `testing/` folder. Imports
  have no file extension (bundler resolution), unlike the API.
- The API is called with relative URLs (`/api/v1/...`). The page and the API share an origin in
  development (`ng serve` proxies `/api` to http://localhost:3000, see `proxy.conf.json`) and
  in production (nginx), so the API keeps CORS off. API errors are RFC 9457 Problem Details
  (`application/problem+json`, validation errors listed per field in `errors`).
- `TasksApi` (`tasks/tasks-api.ts`) is the only code that knows the tasks URLs. Lists are
  `httpResource`s (read `value()` only when `hasValue()`: it throws in the error state); changes
  return promises. A `PATCH` sends only the changed fields, with `null` for a cleared one.
- Show an API error with `errorMessage(error)` (`core/problem-details.ts`): it turns any error
  into a sentence for the user (the server's `detail`, or a fixed text when the server cannot be
  reached, for 429 and for 5xx). Branch on `hasStatus(error, status)` (a 404 after a change means
  the task was deleted elsewhere) and read the details with `problemOf(error)`.
- What a page shows lives in the URL, so it can be bookmarked and Back restores it: the list's
  filters and page are query parameters bound to inputs (`withComponentInputBinding()`), read
  with fallbacks to the defaults (`parseTaskQuery`) and written without them (`toUrlParams`).
- Due dates are calendar dates (`YYYY-MM-DD`, no time zone): convert them with
  `core/calendar-date.ts`, which works in local time, never with `toISOString()` (it can shift
  the day).

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
- A list has loading (a progress bar over the previous page, which stays on screen), empty and
  error states (the error offers "Try again"). The outcome of an action is told in a snack bar;
  a destructive action asks first with `confirm()` (`shared/confirm-dialog.ts`). When the
  focused element goes away (a deleted row), move the focus to a stable container.
- User-facing text is in English.

## Tests and lint

- Unit tests sit next to the code (`*.spec.ts`) and run with Vitest + jsdom (`ng test`). Test
  through what the user or the caller sees: `RouterTestingHarness` for routes,
  `HttpTestingController` (`provideHttpClientTesting()`) for HTTP calls, Material component
  harnesses for Material components and `MatIconTestingModule` when a component shows icons.
- `httpResource` and `HttpClient` count as pending work, so `fixture.whenStable()` and the
  Material harnesses wait until every request is answered: start the action without awaiting
  it, answer the request (`vi.waitFor` around `expectOne(url).flush(...)`), then await the
  action. Disable Material animations (`MATERIAL_ANIMATIONS`) and build test data with the
  fixtures in `tasks/testing/task-fixtures.ts` (`aTask`, `aPage`, `aProblem`).
- ESLint (angular-eslint, type-aware) includes the template accessibility rules; `any` and
  floating promises are errors and `console` is limited to `warn` and `error`.
