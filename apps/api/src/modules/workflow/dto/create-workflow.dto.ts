import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  validateSync,
  ValidationError,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import type { WorkflowDefinition } from '../interfaces/workflow-definition.interface';

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Key must be a slug-like identifier containing only lowercase letters, numbers, and hyphens (e.g. lead-routing)',
  })
  key: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  definition?: WorkflowDefinition;

  @IsOptional()
  metadata?: Record<string, any>;

  static validate(dto: CreateWorkflowDto) {
    const instance =
      dto instanceof CreateWorkflowDto
        ? dto
        : Object.assign(new CreateWorkflowDto(), dto);
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
