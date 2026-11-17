import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { today } from '../core/calendar-date';
import { errorMessage, hasStatus } from '../core/problem-details';
import { confirm } from '../shared/confirm-dialog';
import { Task, TASK_STATUS_LABELS, TaskPage, TaskQuery } from './task';
import { TaskFilters } from './task-filters';
import { TaskFormDialog, TaskFormDialogData, TaskFormDialogResult } from './task-form-dialog';
import { PAGE_SIZE_OPTIONS, parseTaskQuery, toUrlParams } from './task-query';
import { TaskStatusChange, TaskTable } from './task-table';
import { TasksApi } from './tasks-api';

/**
 * The task list. Its filters and page live in the URL (`?status=&assignee=&page=&pageSize=`),
 * so a view can be bookmarked or shared, and Back returns to the previous one.
 */
@Component({
  selector: 'app-tasks-page',
  imports: [MatButton, MatIcon, MatPaginator, MatProgressBar, TaskFilters, TaskTable],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.scss',
})
export class TasksPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly api = inject(TasksApi);

  /** Query parameters, bound by the router (`withComponentInputBinding`). */
  readonly status = input<string>();
  readonly assignee = input<string>();
  readonly page = input<string>();
  readonly pageSize = input<string>();

  protected readonly query = computed(() =>
    parseTaskQuery({
      status: this.status(),
      assignee: this.assignee(),
      page: this.page(),
      pageSize: this.pageSize(),
    }),
  );
  protected readonly tasks = this.api.listResource(this.query);

  /** The last page received: it stays on screen while the next one loads, so nothing flickers. */
  protected readonly taskPage = linkedSignal<TaskPage | undefined, TaskPage | undefined>({
    source: () => (this.tasks.hasValue() ? this.tasks.value() : undefined),
    computation: (page, previous) => page ?? previous?.value,
  });

  protected readonly filtered = computed(
    () => this.query().status !== undefined || this.query().assignee !== undefined,
  );
  protected readonly today = today();
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly errorMessage = errorMessage;

  private readonly results = viewChild<ElementRef<HTMLElement>>('results');

  constructor() {
    // Past the last page (a shared link, or the last task of the page was deleted): show the
    // last page instead of an empty one.
    effect(() => {
      const page = this.tasks.hasValue() ? this.tasks.value() : undefined;
      if (page && page.totalPages > 0 && page.page > page.totalPages) {
        this.show({ page: page.totalPages });
      }
    });
  }

  protected filter(filters: Pick<TaskQuery, 'status'> | Pick<TaskQuery, 'assignee'>): void {
    this.show({ ...filters, page: 1 });
  }

  protected clearFilters(): void {
    this.show({ status: undefined, assignee: undefined, page: 1 });
  }

  protected changePage(event: PageEvent): void {
    const pageSize = event.pageSize;
    // A new page size starts over from the first page.
    const page = pageSize === this.query().pageSize ? event.pageIndex + 1 : 1;
    this.show({ page, pageSize });
  }

  /** Opens the form to create a task, or to edit `task`, and refreshes the list after a save. */
  protected async openForm(task?: Task): Promise<void> {
    const dialogRef = this.dialog.open<TaskFormDialog, TaskFormDialogData, TaskFormDialogResult>(
      TaskFormDialog,
      { data: { task }, width: '560px' },
    );
    const result = await firstValueFrom(dialogRef.afterClosed());

    if (result === 'missing') {
      this.notify('This task no longer exists.');
      this.tasks.reload();
    } else if (result && task) {
      this.notify('Task saved.');
      this.tasks.reload();
    } else if (result) {
      this.notify('Task created.');
      // The newest tasks come first: show the first page.
      if (untracked(this.query).page === 1) {
        this.tasks.reload();
      } else {
        this.show({ page: 1 });
      }
    }
  }

  /** Moves a task to another status straight from the list. */
  protected changeStatus({ task, status }: TaskStatusChange): Promise<void> {
    return this.apply(
      () => this.api.update(task.id, { status }),
      `Marked as ${TASK_STATUS_LABELS[status].toLowerCase()}.`,
    );
  }

  /** Deletes a task once the user confirms it. */
  protected async deleteTask(task: Task): Promise<void> {
    const confirmed = await confirm(this.dialog, {
      title: 'Delete task?',
      message: `"${task.title}" will be deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (confirmed) {
      // Deleting the only task of the last page leaves that page empty: the list then moves
      // back to the new last page on its own.
      await this.apply(() => this.api.delete(task.id), 'Task deleted.');
      // Its row, and the menu button the focus would return to, are gone.
      this.results()?.nativeElement.focus();
    }
  }

  /** Runs a change to one task, says how it went and refreshes the list if anything changed. */
  private async apply(change: () => Promise<unknown>, done: string): Promise<void> {
    try {
      await change();
      this.notify(done);
      this.tasks.reload();
    } catch (error) {
      if (hasStatus(error, HttpStatusCode.NotFound)) {
        this.notify('This task no longer exists.');
        this.tasks.reload();
      } else {
        // Nothing changed: the list stays as it is.
        this.notify(errorMessage(error));
      }
    }
  }

  private notify(message: string): void {
    this.snackBar.open(message, undefined, { duration: 4000 });
  }

  /** Navigates to the list with `changes` applied to the current query. */
  private show(changes: Partial<TaskQuery>): void {
    const query = { ...untracked(this.query), ...changes };
    void this.router.navigate([], { relativeTo: this.route, queryParams: toUrlParams(query) });
  }
}
