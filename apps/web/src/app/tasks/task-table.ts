import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { Task, TASK_STATUS_LABELS, TASK_STATUSES, TaskStatus } from './task';

/** A request to move a task to another status. */
export interface TaskStatusChange {
  task: Task;
  status: TaskStatus;
}

const STATUS_ICONS: Readonly<Record<TaskStatus, string>> = {
  pending: 'radio_button_unchecked',
  in_progress: 'progress_activity',
  done: 'check_circle',
};

/** The tasks of one page, as a table with a menu of actions per task. */
@Component({
  selector: 'app-task-table',
  imports: [
    DatePipe,
    MatDivider,
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
  readonly statusChange = output<TaskStatusChange>();
  readonly delete = output<Task>();

  protected readonly columns = ['title', 'status', 'assignee', 'dueDate', 'actions'];
  protected readonly statusIcons = STATUS_ICONS;

  protected statusLabel(task: Task): string {
    return TASK_STATUS_LABELS[task.status];
  }

  protected isOverdue(task: Task): boolean {
    // Calendar dates compare correctly as text.
    return task.dueDate !== null && task.status !== 'done' && task.dueDate < this.today();
  }

  /** The statuses a task can move to: every one but its own, in workflow order. */
  protected otherStatuses(task: Task): TaskStatus[] {
    return TASK_STATUSES.filter((status) => status !== task.status);
  }

  protected markAsLabel(status: TaskStatus): string {
    return `Mark as ${TASK_STATUS_LABELS[status].toLowerCase()}`;
  }
}
