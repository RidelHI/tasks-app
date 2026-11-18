import { Component, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import {
  isTaskStatus,
  TASK_ASSIGNEE_MAX_LENGTH,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TaskStatus,
} from './task';

/**
 * Filters of the task list. The status applies as soon as it is picked; the assignee when the
 * user presses Enter or leaves the field, because the API matches the whole name.
 */
@Component({
  selector: 'app-task-filters',
  imports: [MatButton, MatFormField, MatHint, MatInput, MatLabel, MatOption, MatSelect],
  template: `
    <mat-form-field subscriptSizing="dynamic">
      <mat-label>Status</mat-label>
      <mat-select [value]="status() ?? ''" (selectionChange)="pickStatus($event.value)">
        <mat-option value="">All statuses</mat-option>
        @for (option of statuses; track option) {
          <mat-option [value]="option">{{ statusLabels[option] }}</mat-option>
        }
      </mat-select>
    </mat-form-field>

    <mat-form-field subscriptSizing="dynamic">
      <mat-label>Assignee</mat-label>
      <input
        #assigneeInput
        matInput
        autocomplete="off"
        [maxLength]="assigneeMaxLength"
        [value]="assignee() ?? ''"
        (keydown.enter)="applyAssignee(assigneeInput.value)"
        (blur)="applyAssignee(assigneeInput.value)"
      />
      <mat-hint>Full name, then press Enter</mat-hint>
    </mat-form-field>

    @if (status() || assignee()) {
      <button matButton type="button" (click)="cleared.emit()">Clear filters</button>
    }
  `,
  styles: `
    // Aligned to the top: only the assignee has a hint under its box, so centering would push
    // the other controls down by half the hint's height.
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 8px 16px;
    }

    mat-form-field {
      width: 240px;
    }

    // Centers the 40px button on the 56px box of the fields.
    button {
      margin-top: 8px;
    }
  `,
})
export class TaskFilters {
  readonly status = input<TaskStatus>();
  readonly assignee = input<string>();

  readonly statusChange = output<TaskStatus | undefined>();
  readonly assigneeChange = output<string | undefined>();
  readonly cleared = output();

  protected readonly statuses = TASK_STATUSES;
  protected readonly statusLabels = TASK_STATUS_LABELS;
  protected readonly assigneeMaxLength = TASK_ASSIGNEE_MAX_LENGTH;

  protected pickStatus(value: unknown): void {
    this.statusChange.emit(isTaskStatus(value) ? value : undefined);
  }

  protected applyAssignee(value: string): void {
    const assignee = value.trim() || undefined;
    if (assignee !== this.assignee()) {
      this.assigneeChange.emit(assignee);
    }
  }
}
