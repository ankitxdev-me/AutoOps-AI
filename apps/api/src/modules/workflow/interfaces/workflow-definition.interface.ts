import {
  WorkflowTriggerType,
  WorkflowVariableType,
  WorkflowStepType,
} from '@prisma/client';

export interface WorkflowTriggerDefinition {
  type: WorkflowTriggerType;
  configuration?: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  value: any;
}

export interface WorkflowAction {
  id: string;
  name: string;
  type: WorkflowStepType;
  configuration: Record<string, any>;
  sortOrder: number;
}

export interface WorkflowVariableDefinition {
  key: string;
  type: WorkflowVariableType;
  defaultValue?: unknown;
}

export interface WorkflowDefinition {
  trigger: WorkflowTriggerDefinition;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  variables?: WorkflowVariableDefinition[];
  fallback: Record<string, any>;
}
