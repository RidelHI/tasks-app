import { HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  maxLength,
  required,
  TreeValidationResult,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { fromCalendarDate, toCalendarDate } from '../core/calendar-date';
import { errorMessage, hasStatus, problemOf } from '../core/problem-details';
import {
  NewTask,
  Task,
  TASK_ASSIGNEE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  TASK_TITLE_MAX_LENGTH,
  TaskChanges,
  TaskStatus,
} from './task';
import { TasksApi } from './tasks-api';

export interface TaskFormDialogData {
  /** The task to edit; without it the dialog creates a new one. */
  task?: Task;
}

/**
 * How the dialog closed: the task it saved, `'missing'` when the task was deleted while being
 * edited, or `undefined` when nothing was saved (cancelled, or saved without changes).
 */
export type TaskFormDialogResult = Task | 'missing' | undefined;

/** What the form edits: text fields stay strings (empty means "not set") and the date a `Date`. */
interface TaskFormModel {
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  dueDate: Date | null;
}

type TaskFields = Required<NewTask>;

function toModel(task?: Task): TaskFormModel {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'pending',
    assignee: task?.assignee ?? '',
    dueDate: task?.dueDate ? fromCalendarDate(task.dueDate) : null,
  };
}

/** The task fields as the API expects them: trimmed, and `null` for the ones left empty. */
function toFields(model: TaskFormModel): TaskFields {
  return {
    title: model.title.trim(),
    description: model.description.trim() === '' ? null : model.description,
    status: model.status,
    assignee: model.assignee.trim() || null,
    dueDate: model.dueDate ? toCalendarDate(model.dueDate) : null,
  };
}

/** Only the fields that differ from `task`, so a save never overwrites what it did not touch. */
function changesOf(task: Task, fields: TaskFields): TaskChanges {
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => task[key as keyof TaskFields] !== value),
  );
}

const tooLong = (max: number) => ({ message: `Use ${max} characters or fewer.` });

/** Messages for errors that come from Material controls (their validators carry none). */
const CONTROL_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  matDatepickerParse: 'Enter a valid date (MM/DD/YYYY).',
};

/** Creates a task or edits one, with the API's validation errors shown on their fields. */
@Component({
  selector: 'app-task-form-dialog',
  imports: [
    FormField,
    FormRoot,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    MatSuffix,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './task-form-dialog.html',
  styleUrl: './task-form-dialog.scss',
})
export class TaskFormDialog {
  private readonly api = inject(TasksApi);
  private readonly dialogRef =
    inject<MatDialogRef<TaskFormDialog, TaskFormDialogResult>>(MatDialogRef);

  protected readonly task = inject<TaskFormDialogData>(MAT_DIALOG_DATA).task;
  protected readonly statuses = TASK_STATUSES;
  protected readonly statusLabels = TASK_STATUS_LABELS;

  private readonly model = signal(toModel(this.task));
  protected readonly taskForm = form(
    this.model,
    (task) => {
      required(task.title, { message: 'Enter a title.' });
      validate(task.title, ({ value }) =>
        value() !== '' && value().trim() === ''
          ? { kind: 'blank', message: 'Enter a title.' }
          : undefined,
      );
      maxLength(task.title, TASK_TITLE_MAX_LENGTH, tooLong(TASK_TITLE_MAX_LENGTH));
      maxLength(
        task.description,
        TASK_DESCRIPTION_MAX_LENGTH,
        tooLong(TASK_DESCRIPTION_MAX_LENGTH),
      );
      maxLength(task.assignee, TASK_ASSIGNEE_MAX_LENGTH, tooLong(TASK_ASSIGNEE_MAX_LENGTH));
    },
    {
      submission: {
        action: () => this.save(),
        // Takes keyboard and screen reader users to the first field to fix.
        onInvalid: (form) => form().errorSummary()[0]?.fieldTree().focusBoundControl(),
      },
    },
  );

  protected messageOf(error: ValidationError): string {
    return error.message ?? CONTROL_ERROR_MESSAGES[error.kind] ?? 'Check this value.';
  }

  private async save(): Promise<TreeValidationResult> {
    const fields = toFields(this.model());
    try {
      if (!this.task) {
        this.dialogRef.close(await this.api.create(fields));
        return undefined;
      }
      const changes = changesOf(this.task, fields);
      this.dialogRef.close(
        Object.keys(changes).length > 0 ? await this.api.update(this.task.id, changes) : undefined,
      );
      return undefined;
    } catch (error) {
      if (this.task && hasStatus(error, HttpStatusCode.NotFound)) {
        this.dialogRef.close('missing');
        return undefined;
      }
      return this.submissionErrors(error);
    }
  }

  /** The API's errors on the fields they belong to; anything else on the whole form. */
  private submissionErrors(error: unknown): TreeValidationResult {
    const fieldErrors = problemOf(error)?.errors ?? [];
    if (fieldErrors.length === 0) {
      return { fieldTree: this.taskForm, kind: 'server', message: errorMessage(error) };
    }
    return fieldErrors.map(({ field, messages }) => ({
      fieldTree: this.fieldTree(field) ?? this.taskForm,
      kind: 'server',
      message: messages.join(' '),
    }));
  }

  private fieldTree(field: string) {
    const { title, description, status, assignee, dueDate } = this.taskForm;
    const fields = { title, description, status, assignee, dueDate };
    return Object.hasOwn(fields, field) ? fields[field as keyof typeof fields] : undefined;
  }
}
