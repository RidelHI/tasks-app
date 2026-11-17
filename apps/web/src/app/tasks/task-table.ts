import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { Task, TASK_STATUS_LABELS } from './task';

/** The tasks of one page, as a table with a menu of actions per task. */
@Component({
  selector: 'app-task-table',
  imports: [
    DatePipe,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatMenuTrigger,
    MatTableModule,
  ],
  templateUrl: './task-table.html',
  styleUrl: './task-table.scss',
})
export class TaskTable {
  readonly tasks = input.required<Task[]>();
  /** Today's calendar date (`YYYY-MM-DD`), to flag overdue tasks. */
  readonly today = input.required<string>();

  readonly edit = output<Task>();

  protected readonly columns = ['title', 'status', 'assignee', 'dueDate', 'actions'];

  protected statusLabel(task: Task): string {
    return TASK_STATUS_LABELS[task.status];
  }

  protected isOverdue(task: Task): boolean {
    // Calendar dates compare correctly as text.
    return task.dueDate !== null && task.status !== 'done' && task.dueDate < this.today();
  }
}
