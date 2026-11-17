import type { PageMeta } from './page.js';

/** Pagination fields of every paginated response; subclasses add the typed `items`. */
export abstract class PageResponseDto implements PageMeta {
  /** @example 1 */
  page: number;

  /** @example 20 */
  pageSize: number;

  /** Matching items across all pages. @example 57 */
  totalItems: number;

  /** @example 3 */
  totalPages: number;
}
