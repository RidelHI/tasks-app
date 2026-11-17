/** Task statuses in workflow order (the values the API accepts). */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

/** Field limits enforced by the API. */
export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;
export const TASK_ASSIGNEE_MAX_LENGTH = 100;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

/** A task as the API returns it. `dueDate` is a calendar date (`YYYY-MM-DD`). */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body to create a task: only the title is required. */
export interface NewTask {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  assignee?: string | null;
  dueDate?: string | null;
}

/** JSON Merge Patch of a task: absent fields stay unchanged, `null` clears an optional field. */
export type TaskChanges = Partial<NewTask>;

/** Filters and page of the task list. */
export interface TaskQuery {
  status?: TaskStatus;
  /** Whole name of the assignee; the API ignores case. */
  assignee?: string;
  /** Starts at 1. */
  page: number;
  pageSize: number;
}

/** One page of the task list, newest first. */
export interface TaskPage {
  items: Task[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
