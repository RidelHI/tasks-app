import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { firstValueFrom } from 'rxjs';
import { Task } from './task';
import { TaskFormDialog, TaskFormDialogData, TaskFormDialogResult } from './task-form-dialog';
import { aProblem, aTask } from './testing/task-fixtures';

@Component({ template: '' })
class Host {}

describe('TaskFormDialog', () => {
  let http: HttpTestingController;
  let loader: HarnessLoader;
  let closed: Promise<TaskFormDialogResult>;

  async function open(task?: Task) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Host);
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);

    const dialogRef = TestBed.inject(MatDialog).open<
      TaskFormDialog,
      TaskFormDialogData,
      TaskFormDialogResult
    >(TaskFormDialog, { data: { task } });
    closed = firstValueFrom(dialogRef.afterClosed());
    await fixture.whenStable();
  }

  afterEach(() => {
    http.verify();
  });

  const field = (label: string) =>
    loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: new RegExp(`^${label}`) }));

  async function input(label: string): Promise<MatInputHarness> {
    const control = await (await field(label)).getControl(MatInputHarness);
    if (!control) throw new Error(`No input labelled ${label}`);
    return control;
  }

  async function select(label: string, option: string) {
    const control = await (await field(label)).getControl(MatSelectHarness);
    await control?.clickOptions({ text: option });
  }

  async function dueDate(value: string) {
    const control = await (await field('Due date')).getControl(MatDatepickerInputHarness);
    await control?.setValue(value);
  }

  const errorsOf = async (label: string) => (await field(label)).getTextErrors();
  const button = (text: string) => loader.getHarness(MatButtonHarness.with({ text }));
  const isOpen = async () => (await loader.getAllHarnesses(MatDialogHarness)).length > 0;

  /** Clicks a button that sends a request and answers it (the click waits for the response). */
  async function submitting(text: string, url: string, body: object, status = 200) {
    const click = (await button(text)).click();
    let method = '';
    let sent: unknown;
    await vi.waitFor(() => {
      const request = http.expectOne(url);
      method = request.request.method;
      sent = request.request.body;
      request.flush(body, { status, statusText: String(status) });
    });
    await click;
    return { method, sent };
  }

  describe('creating a task', () => {
    beforeEach(async () => {
      await open();
    });

    it('sends the fields that were filled, trimmed, and closes with the new task', async () => {
      await (await input('Title')).setValue('  Write the README ');
      await (await input('Assignee')).setValue(' Jane Doe ');
      await select('Status', 'In progress');
      await dueDate('12/24/2026');
      const created = aTask({ title: 'Write the README' });

      const { method, sent } = await submitting('Create', '/api/v1/tasks', created);

      expect(method).toBe('POST');
      expect(sent).toEqual({
        title: 'Write the README',
        description: null,
        status: 'in_progress',
        assignee: 'Jane Doe',
        dueDate: '2026-12-24',
      });
      await expect(closed).resolves.toEqual(created);
    });

    it.each([
      ['empty', ''],
      ['blank', '   '],
    ])('requires a title (%s)', async (_, title) => {
      await (await input('Title')).setValue(title);
      await (await button('Create')).click();

      http.expectNone('/api/v1/tasks');
      expect(await errorsOf('Title')).toEqual(['Enter a title.']);
      expect(await isOpen()).toBe(true);
    });

    it('limits the title to 200 characters', async () => {
      await (await input('Title')).setValue('x'.repeat(201));
      await (await button('Create')).click();

      expect(await errorsOf('Title')).toEqual(['Use 200 characters or fewer.']);
    });

    it('rejects a due date that is not a date', async () => {
      await (await input('Title')).setValue('Write the README');
      await dueDate('13/45/2026');
      await (await button('Create')).click();

      http.expectNone('/api/v1/tasks');
      expect(await errorsOf('Due date')).toEqual(['Enter a valid date (MM/DD/YYYY).']);
    });

    it('shows the API validation errors on their fields, and the rest on the form', async () => {
      await (await input('Title')).setValue('Write the README');

      await submitting(
        'Create',
        '/api/v1/tasks',
        {
          ...aProblem(400, 'Bad Request', 'The request contains invalid fields.'),
          errors: [
            { field: 'title', messages: ['title is reserved'] },
            { field: 'priority', messages: ['property priority should not exist'] },
          ],
        },
        400,
      );

      expect(await errorsOf('Title')).toEqual(['title is reserved']);
      expect(await (await loader.getHarness(MatDialogHarness)).getContentText()).toContain(
        'property priority should not exist',
      );
      expect(await isOpen()).toBe(true);
    });

    it('explains any other failure and stays open to try again', async () => {
      await (await input('Title')).setValue('Write the README');

      await submitting(
        'Create',
        '/api/v1/tasks',
        aProblem(503, 'Service Unavailable', 'The service is not ready.'),
        503,
      );

      expect(await (await loader.getHarness(MatDialogHarness)).getContentText()).toContain(
        'Something went wrong on our side. Try again in a moment.',
      );
      expect(await isOpen()).toBe(true);
    });
  });

  describe('editing a task', () => {
    const task = aTask({
      title: 'Write the README',
      description: 'How to run it',
      status: 'in_progress',
      assignee: 'Jane Doe',
      dueDate: '2026-12-24',
    });
    const url = `/api/v1/tasks/${task.id}`;

    beforeEach(async () => {
      await open(task);
    });

    it('starts from the current values', async () => {
      expect(await (await input('Title')).getValue()).toBe('Write the README');
      expect(await (await input('Description')).getValue()).toBe('How to run it');
      expect(await (await input('Assignee')).getValue()).toBe('Jane Doe');
      const date = await (await field('Due date')).getControl(MatDatepickerInputHarness);
      expect(await date?.getValue()).toBe('12/24/2026');
    });

    it('sends only the fields that changed; an emptied field is cleared with null', async () => {
      await select('Status', 'Done');
      await (await input('Assignee')).setValue('');
      const saved = { ...task, status: 'done' as const, assignee: null };

      const { method, sent } = await submitting('Save', url, saved);

      expect(method).toBe('PATCH');
      expect(sent).toEqual({ status: 'done', assignee: null });
      await expect(closed).resolves.toEqual(saved);
    });

    it('closes without a request when nothing changed', async () => {
      await (await button('Save')).click();

      http.expectNone(url);
      await expect(closed).resolves.toBeUndefined();
    });

    it('reports a task that was deleted meanwhile', async () => {
      await (await input('Title')).setValue('Renamed');

      await submitting('Save', url, aProblem(404, 'Not Found', 'Task was not found.'), 404);

      await expect(closed).resolves.toBe('missing');
    });
  });
});
