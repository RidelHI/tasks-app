import { isTaskStatus, TASK_ASSIGNEE_MAX_LENGTH, TaskQuery } from './task';

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS: readonly number[] = [10, 20, 50, 100];

/** Limits of the API: larger values are rejected with a 400. */
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 1_000_000;

/** The list query as it comes in the URL: every parameter is optional text. */
export interface TaskQueryParams {
  status?: string;
  assignee?: string;
  page?: string;
  pageSize?: string;
}

/**
 * Reads the list query from the URL. A value the API would reject (an unknown status, a page
 * that is not a number...) falls back to its default instead of failing the whole list.
 */
export function parseTaskQuery(params: TaskQueryParams): TaskQuery {
  const assignee = params.assignee?.trim();

  return {
    ...(isTaskStatus(params.status) && { status: params.status }),
    ...(assignee && assignee.length <= TASK_ASSIGNEE_MAX_LENGTH && { assignee }),
    page: integerUpTo(params.page, MAX_PAGE) ?? 1,
    pageSize: integerUpTo(params.pageSize, MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
  };
}

/**
 * The URL query parameters of `query`. Defaults are left out to keep URLs short; `null` tells
 * the router to drop the parameter.
 */
export function toUrlParams(query: TaskQuery): Record<string, string | number | null> {
  return {
    status: query.status ?? null,
    assignee: query.assignee ?? null,
    page: query.page === 1 ? null : query.page,
    pageSize: query.pageSize === DEFAULT_PAGE_SIZE ? null : query.pageSize,
  };
}

/** A positive integer written in plain digits, from 1 to `max`. */
function integerUpTo(value: string | undefined, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  const number = Number(value);
  return number >= 1 && number <= max ? number : undefined;
}
