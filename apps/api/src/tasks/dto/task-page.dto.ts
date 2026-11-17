import { type Page, type PageRequest, pageMeta } from '../../common/pagination/page.js';
import { PageResponseDto } from '../../common/pagination/page-response.dto.js';
import type { Task } from '../task.entity.js';
import { TaskResponseDto } from './task-response.dto.js';

export class TaskPageDto extends PageResponseDto {
  items: TaskResponseDto[];

  static from(page: Page<Task>, request: PageRequest): TaskPageDto {
    return {
      items: page.items.map((task) => TaskResponseDto.fromEntity(task)),
      ...pageMeta(request, page.totalItems),
    };
  }
}
