import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ApiProblem } from '../common/errors/api-problem.decorator.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TaskResponseDto } from './dto/task-response.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  /** Creates a task. The `Location` header points to the new task. */
  @Post()
  @ApiProblem(400, 'The request contains invalid fields.')
  async create(
    @Body() dto: CreateTaskDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TaskResponseDto> {
    const task = await this.tasks.create(dto);
    const collectionPath = request.originalUrl.split('?')[0]?.replace(/\/$/, '');
    response.location(`${collectionPath}/${task.id}`);
    return TaskResponseDto.fromEntity(task);
  }

  /** Returns one task. */
  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProblem(400, 'The id is not a UUID.')
  @ApiProblem(404, 'The task does not exist.')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TaskResponseDto> {
    return TaskResponseDto.fromEntity(await this.tasks.findById(id));
  }

  /**
   * Changes some fields of a task (JSON Merge Patch): absent fields stay unchanged and `null`
   * clears `description`, `assignee` or `dueDate`.
   */
  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProblem(400, 'The id is not a UUID or the request contains invalid fields.')
  @ApiProblem(404, 'The task does not exist.')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return TaskResponseDto.fromEntity(await this.tasks.update(id, dto));
  }

  /** Deletes a task permanently. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProblem(400, 'The id is not a UUID.')
  @ApiProblem(404, 'The task does not exist.')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tasks.delete(id);
  }
}
