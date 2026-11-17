import { HarnessLoader, TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TasksPage } from './tasks-page';
import { aPage, aProblem, aTask } from './testing/task-fixtures';

describe('TasksPage', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let loader: HarnessLoader;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([{ path: 'tasks', component: TasksPage }], withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    loader = TestbedHarnessEnvironment.loader(harness.fixture);
  });

  afterEach(() => {
    http.verify();
  });

  /** Answers the list request the page is about to send. */
  async function answer(url: string, body: object | null, status = 200) {
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne(url).flush(body, { status, statusText: String(status) });
    });
  }

  /** Answers the list request and waits for the page to show the response. */
  async function respond(url: string, body: object | null, status = 200) {
    await answer(url, body, status);
    await harness.fixture.whenStable();
  }

  /**
   * Runs a user action that loads another page of the list and answers that request. Material
   * harnesses wait for the page to be stable, which includes the request in flight.
   */
  async function loading<T>(action: Promise<T>, url: string, body: object | null): Promise<T> {
    await respond(url, body);
    return action;
  }

  async function open(url: string, apiUrl: string, body: object | null, status = 200) {
    await harness.navigateByUrl(url);
    await respond(apiUrl, body, status);
  }

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const texts = (selector: string) =>
    [...(harness.routeNativeElement?.querySelectorAll(selector) ?? [])].map((element) =>
      element.textContent.trim(),
    );
  const currentUrl = () => TestBed.inject(Router).url;

  it('lists the first page of tasks', async () => {
    await open(
      '/tasks',
      '/api/v1/tasks?page=1&pageSize=20',
      aPage([
        aTask({
          title: 'Write the README',
          description: 'How to run it and the decisions taken',
          status: 'in_progress',
          assignee: 'Jane Doe',
          dueDate: '2999-12-31',
        }),
        aTask({ title: 'Ship it', dueDate: '2000-01-01' }),
        aTask({ title: 'Celebrate', status: 'done', dueDate: '2000-01-01' }),
      ]),
    );

    const table = await loader.getHarness(MatTableHarness);
    const columns = await table.getCellTextByColumnName();
    expect(texts('.title')).toEqual(['Write the README', 'Ship it', 'Celebrate']);
    expect(texts('.description')).toEqual(['How to run it and the decisions taken']);
    expect(columns['status'].text).toEqual(['In progress', 'Pending', 'Done']);
    expect(columns['assignee'].text).toEqual(['Jane Doe', 'Unassigned', 'Unassigned']);
    // Only unfinished tasks can be overdue.
    expect(columns['dueDate'].text).toEqual(['Dec 31, 2999', 'Jan 1, 2000 Overdue', 'Jan 1, 2000']);
  });

  it('reads the filters and the page from the URL', async () => {
    await open(
      '/tasks?status=done&assignee=Jane%20Doe&page=2&pageSize=10',
      '/api/v1/tasks?status=done&assignee=Jane%20Doe&page=2&pageSize=10',
      aPage([aTask({ status: 'done' })], { page: 2, pageSize: 10, totalItems: 11, totalPages: 2 }),
    );

    expect(await (await loader.getHarness(MatSelectHarness)).getValueText()).toBe('Done');
    expect(await (await loader.getHarness(MatInputHarness)).getValue()).toBe('Jane Doe');
    const paginator = await loader.getHarness(MatPaginatorHarness);
    expect(await paginator.getRangeLabel()).toBe('11 – 11 of 11');
  });

  it('filters by status from the first page', async () => {
    await open(
      '/tasks?page=2',
      '/api/v1/tasks?page=2&pageSize=20',
      aPage([aTask()], { page: 2, totalItems: 21, totalPages: 2 }),
    );

    const select = await loader.getHarness(MatSelectHarness);
    await loading(
      select.clickOptions({ text: 'In progress' }),
      '/api/v1/tasks?status=in_progress&page=1&pageSize=20',
      aPage([aTask({ status: 'in_progress' })]),
    );

    expect(currentUrl()).toBe('/tasks?status=in_progress');
  });

  it('filters by assignee when Enter is pressed', async () => {
    await open('/tasks', '/api/v1/tasks?page=1&pageSize=20', aPage([aTask()]));

    const input = await loader.getHarness(MatInputHarness);
    await input.setValue('  jane doe ');
    await loading(
      (await input.host()).sendKeys(TestKey.ENTER),
      '/api/v1/tasks?assignee=jane%20doe&page=1&pageSize=20',
      aPage([aTask({ assignee: 'Jane Doe' })]),
    );

    expect(currentUrl()).toBe('/tasks?assignee=jane%20doe');
  });

  it('moves between pages and starts over when the page size changes', async () => {
    await open(
      '/tasks',
      '/api/v1/tasks?page=1&pageSize=20',
      aPage([aTask()], { totalItems: 45, totalPages: 3 }),
    );

    const paginator = await loader.getHarness(MatPaginatorHarness);
    await loading(
      paginator.goToNextPage(),
      '/api/v1/tasks?page=2&pageSize=20',
      aPage([aTask()], { page: 2, totalItems: 45, totalPages: 3 }),
    );
    expect(currentUrl()).toBe('/tasks?page=2');

    await loading(
      paginator.setPageSize(50),
      '/api/v1/tasks?page=1&pageSize=50',
      aPage([aTask()], { pageSize: 50, totalItems: 45 }),
    );
    expect(currentUrl()).toBe('/tasks?pageSize=50');
  });

  it('says when there are no tasks yet', async () => {
    await open('/tasks', '/api/v1/tasks?page=1&pageSize=20', aPage([]));

    expect(text()).toContain('No tasks yet');
    expect(await loader.getAllHarnesses(MatTableHarness)).toHaveLength(0);
  });

  it('offers to clear the filters when nothing matches them', async () => {
    await open('/tasks?status=done', '/api/v1/tasks?status=done&page=1&pageSize=20', aPage([]));
    expect(text()).toContain('No tasks match these filters');

    const [clear] = await loader.getAllHarnesses(
      MatButtonHarness.with({ text: 'Clear filters', ancestor: '.results' }),
    );
    await loading(clear.click(), '/api/v1/tasks?page=1&pageSize=20', aPage([aTask()]));

    expect(currentUrl()).toBe('/tasks');
  });

  it('shows why the list failed and loads it again on request', async () => {
    await open(
      '/tasks',
      '/api/v1/tasks?page=1&pageSize=20',
      aProblem(503, 'Service Unavailable', 'The service is not ready: database unavailable.'),
      503,
    );

    expect(text()).toContain('The tasks could not be loaded');
    expect(text()).toContain('Something went wrong on our side. Try again in a moment.');
    expect(text()).not.toContain('database');

    const retry = await loader.getHarness(MatButtonHarness.with({ text: 'Try again' }));
    await loading(retry.click(), '/api/v1/tasks?page=1&pageSize=20', aPage([aTask()]));

    expect(await loader.getAllHarnesses(MatTableHarness)).toHaveLength(1);
  });

  it('goes to the last page when the URL points past it', async () => {
    await harness.navigateByUrl('/tasks?page=5');
    // The page asks for the last page right away, before it is stable again.
    await answer(
      '/api/v1/tasks?page=5&pageSize=20',
      aPage([], { page: 5, totalItems: 30, totalPages: 2 }),
    );
    await respond(
      '/api/v1/tasks?page=2&pageSize=20',
      aPage([aTask()], { page: 2, totalItems: 30, totalPages: 2 }),
    );

    expect(currentUrl()).toBe('/tasks?page=2');
  });
});
