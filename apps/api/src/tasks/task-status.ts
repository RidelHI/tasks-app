/** Lifecycle of a task. Stored as text and enforced by the `CHK_tasks_status` constraint. */
export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Status of a new task when none is given. */
export const DEFAULT_TASK_STATUS: TaskStatus = 'pending';
