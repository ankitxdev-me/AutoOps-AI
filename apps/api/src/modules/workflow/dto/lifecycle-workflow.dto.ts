import { IsInt, Min, validateSync, ValidationError } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class PublishWorkflowDto {
  @IsInt()
  @Min(1, { message: 'Revision must be a valid positive integer' })
  revision: number;

  static validate(dto: PublishWorkflowDto) {
    const instance =
      dto instanceof PublishWorkflowDto
        ? dto
        : Object.assign(new PublishWorkflowDto(), dto);
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

export class PauseWorkflowDto {
  @IsInt()
  @Min(1, { message: 'Revision must be a valid positive integer' })
  revision: number;

  static validate(dto: PauseWorkflowDto) {
    const instance =
      dto instanceof PauseWorkflowDto
        ? dto
        : Object.assign(new PauseWorkflowDto(), dto);
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

export class ResumeWorkflowDto {
  @IsInt()
  @Min(1, { message: 'Revision must be a valid positive integer' })
  revision: number;

  static validate(dto: ResumeWorkflowDto) {
    const instance =
      dto instanceof ResumeWorkflowDto
        ? dto
        : Object.assign(new ResumeWorkflowDto(), dto);
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

export class ArchiveWorkflowDto {
  @IsInt()
  @Min(1, { message: 'Revision must be a valid positive integer' })
  revision: number;

  static validate(dto: ArchiveWorkflowDto) {
    const instance =
      dto instanceof ArchiveWorkflowDto
        ? dto
        : Object.assign(new ArchiveWorkflowDto(), dto);
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
