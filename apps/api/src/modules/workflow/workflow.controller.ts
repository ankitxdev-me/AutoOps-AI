import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TenantRequiredGuard } from '../../common/guards/tenant-required.guard';
import {
  TenantContext,
  TenantContextPayload,
} from '../../common/decorators/tenant-context.decorator';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import {
  PublishWorkflowDto,
  PauseWorkflowDto,
  ResumeWorkflowDto,
  ArchiveWorkflowDto,
} from './dto/lifecycle-workflow.dto';

@Controller('workflows')
@UseGuards(ClerkAuthGuard, TenantContextGuard, TenantRequiredGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Post()
  async create(
    @TenantContext() tenantContext: TenantContextPayload,
    @Body() dto: CreateWorkflowDto,
  ) {
    CreateWorkflowDto.validate(dto);
    const result = await this.workflowService.createWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      tenantContext.userId,
      dto,
    );
    return { success: true, data: result };
  }

  @Get()
  async findAll(
    @TenantContext() tenantContext: TenantContextPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? Math.max(1, parseInt(limitStr, 10)) : 20;
    const result = await this.workflowService.listWorkflows(
      tenantContext.tenantId,
      cursor,
      limit,
    );
    return { success: true, data: result };
  }

  @Get(':id')
  async findOne(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
  ) {
    const result = await this.workflowService.getWorkflow(
      tenantContext.tenantId,
      id,
    );
    return { success: true, data: result };
  }

  @Patch(':id')
  async update(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    UpdateWorkflowDto.validate(dto);
    const result = await this.workflowService.updateWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
      dto,
    );
    return { success: true, data: result };
  }

  @Delete(':id')
  async remove(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
  ) {
    const result = await this.workflowService.deleteWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
    );
    return { success: true, data: result };
  }

  @Post(':id/publish')
  async publish(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
    @Body() dto: PublishWorkflowDto,
  ) {
    PublishWorkflowDto.validate(dto);
    const result = await this.workflowService.publishWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
      dto.revision,
    );
    return { success: true, data: result };
  }

  @Post(':id/pause')
  async pause(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
    @Body() dto: PauseWorkflowDto,
  ) {
    PauseWorkflowDto.validate(dto);
    const result = await this.workflowService.pauseWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
      dto.revision,
    );
    return { success: true, data: result };
  }

  @Post(':id/resume')
  async resume(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
    @Body() dto: ResumeWorkflowDto,
  ) {
    ResumeWorkflowDto.validate(dto);
    const result = await this.workflowService.resumeWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
      dto.revision,
    );
    return { success: true, data: result };
  }

  @Post(':id/archive')
  async archive(
    @TenantContext() tenantContext: TenantContextPayload,
    @Param('id') id: string,
    @Body() dto: ArchiveWorkflowDto,
  ) {
    ArchiveWorkflowDto.validate(dto);
    const result = await this.workflowService.archiveWorkflow(
      tenantContext.tenantId,
      tenantContext.role,
      id,
      dto.revision,
    );
    return { success: true, data: result };
  }
}
