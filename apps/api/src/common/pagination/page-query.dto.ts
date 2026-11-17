import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import type { PageRequest } from './page.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
/** Sanity bound: keeps the offset a reasonable integer instead of failing in the database. */
export const MAX_PAGE = 1_000_000;

/** `?page=&pageSize=` query parameters. Extend it for every paginated list. */
export class PageQueryDto implements PageRequest {
  /** Page number, starting at 1. */
  @ApiPropertyOptional({ type: 'integer' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE)
  page: number = 1;

  /** Items per page. */
  @ApiPropertyOptional({ type: 'integer' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
