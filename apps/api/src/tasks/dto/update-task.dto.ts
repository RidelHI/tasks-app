import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto.js';

/**
 * JSON Merge Patch semantics (RFC 7396): absent fields stay unchanged and `null` clears an
 * optional field. `skipNullProperties: false` keeps `null` subject to validation, so it is
 * rejected for the required fields (`title`, `status`) instead of reaching the database.
 */
export class UpdateTaskDto extends PartialType(CreateTaskDto, { skipNullProperties: false }) {}
