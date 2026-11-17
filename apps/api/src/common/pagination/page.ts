/** Which page a client asked for (page numbers start at 1). */
export interface PageRequest {
  page: number;
  pageSize: number;
}

/** One page of results, as a repository returns it. */
export interface Page<T> {
  items: T[];
  /** Matching items across all pages. */
  totalItems: number;
}

export interface PageMeta extends PageRequest {
  totalItems: number;
  totalPages: number;
}

/** Number of items before the requested page (SQL `OFFSET`). */
export function offsetOf({ page, pageSize }: PageRequest): number {
  return (page - 1) * pageSize;
}

export function pageMeta({ page, pageSize }: PageRequest, totalItems: number): PageMeta {
  return { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
}
