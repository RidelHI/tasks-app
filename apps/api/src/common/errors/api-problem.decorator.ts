import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ProblemDetailsDto } from './problem-details.dto.js';
import { PROBLEM_JSON_CONTENT_TYPE } from './problem-details.filter.js';

/**
 * Documents an error response of an endpoint as `application/problem+json`. Not named
 * `Api...Response`: the Swagger plugin would take it for a success response and stop
 * documenting the one it infers from the return type.
 */
export function ApiProblem(status: number, description: string) {
  return applyDecorators(
    ApiExtraModels(ProblemDetailsDto),
    ApiResponse({
      status,
      description,
      content: {
        [PROBLEM_JSON_CONTENT_TYPE]: { schema: { $ref: getSchemaPath(ProblemDetailsDto) } },
      },
    }),
  );
}
