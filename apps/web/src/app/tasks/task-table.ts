import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Task, TASK_STATUS_LABELS } from './task';

/** The tasks of one page, as a table. */
@Component({
  selector: 'app-task-table',
  imports: [DatePipe, MatTableModule],
  templateUrl: './task-table.html',
  styleUrl: './task-table.scss',
})
export class TaskTable {
  readonly tasks = input.required<Task[]>();
  /** Today's calendar date (`YYYY-MM-DD`), to flag overdue tasks. */
  readonly today = input.required<string>();

  protected readonly columns = ['title', 'status', 'assignee', 'dueDate'];

  protected statusLabel(task: Task): string {
    return TASK_STATUS_LABELS[task.status];
  }

  protected isOverdue(task: Task): boolean {
    // Calendar dates compare correctly as text.
    return task.dueDate !== null && task.status !== 'done' && task.dueDate < this.today();
  }
}
