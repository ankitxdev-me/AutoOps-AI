import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MinLength,
  MaxLength,
  validateSync,
  ValidationError,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import type { WorkflowDefinition } from '../interfaces/workflow-definition.interface';

export class UpdateWorkflowDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  definition?: WorkflowDefinition;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsInt()
  @Min(1, { message: 'Revision must be a valid positive integer' })
  revision: number;

  static validate(dto: UpdateWorkflowDto) {
    const instance =
      dto instanceof UpdateWorkflowDto
        ? dto
        : Object.assign(new UpdateWorkflowDto(), dto);
    const errors = validateSync(instance);
    if (errors.length > 0) {
      const messages = errors
        .map((err: ValidationError) =>
          Object.values(err.constraints || {}).join(', '),
        )
        .join('; ');
      throw new BadRequestException(messages);
    }
  }
}
