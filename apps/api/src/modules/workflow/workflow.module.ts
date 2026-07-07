import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowDefinitionValidator } from './workflow-definition-validator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowDefinitionValidator],
  exports: [WorkflowService, WorkflowDefinitionValidator],
})
export class WorkflowModule {}
