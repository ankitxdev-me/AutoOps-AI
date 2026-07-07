import { Injectable } from '@nestjs/common';
import {
  WorkflowTriggerType,
  WorkflowVariableType,
  WorkflowStepType,
} from '@prisma/client';
import {
  WorkflowDefinition,
  WorkflowTriggerDefinition,
  WorkflowCondition,
  WorkflowAction,
  WorkflowVariableDefinition,
} from './interfaces/workflow-definition.interface';

export interface ValidationErrorDetail {
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
  path: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

@Injectable()
export class WorkflowDefinitionValidator {
  private readonly APPROVED_OPERATORS = [
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'contains',
    'exists',
  ];

  validate(definition: Partial<WorkflowDefinition>): ValidationResult {
    const errors: ValidationErrorDetail[] = [];

    if (!definition) {
      errors.push({
        field: 'definition',
        code: 'MISSING_DEFINITION',
        message: 'Workflow definition payload is empty.',
        severity: 'error',
        path: [],
      });
      return { isValid: false, errors };
    }

    // 1. Trigger Validation
    this.validateTrigger(definition.trigger, errors);

    // 2. Conditions Validation
    this.validateConditions(definition.conditions, errors);

    // 3. Actions Validation
    this.validateActions(definition.actions, errors);

    // 4. Variables Validation
    this.validateVariables(definition.variables, errors);

    // 5. Fallback Validation
    this.validateFallback(definition.fallback, errors);

    // 6. Cross-reference Validation
    this.validateReferences(definition, errors);

    return {
      isValid: errors.filter((e) => e.severity === 'error').length === 0,
      errors,
    };
  }

  private validateTrigger(
    trigger: WorkflowTriggerDefinition | undefined,
    errors: ValidationErrorDetail[],
  ) {
    if (!trigger) {
      errors.push({
        field: 'trigger',
        code: 'MISSING_TRIGGER',
        message: 'Workflow must declare a trigger.',
        severity: 'error',
        path: ['trigger'],
      });
      return;
    }

    if (!trigger.type) {
      errors.push({
        field: 'trigger.type',
        code: 'MISSING_TRIGGER_TYPE',
        message: 'Trigger type is required.',
        severity: 'error',
        path: ['trigger', 'type'],
      });
      return;
    }

    if (!Object.values(WorkflowTriggerType).includes(trigger.type)) {
      errors.push({
        field: 'trigger.type',
        code: 'INVALID_TRIGGER_TYPE',
        message: `Trigger type '${trigger.type}' is not supported.`,
        severity: 'error',
        path: ['trigger', 'type'],
      });
    }
  }

  private validateConditions(
    conditions: WorkflowCondition[] | undefined,
    errors: ValidationErrorDetail[],
  ) {
    if (!conditions) return;

    if (!Array.isArray(conditions)) {
      errors.push({
        field: 'conditions',
        code: 'INVALID_CONDITIONS_FORMAT',
        message: 'Conditions property must be an array.',
        severity: 'error',
        path: ['conditions'],
      });
      return;
    }

    conditions.forEach((cond, index) => {
      const path = ['conditions', index.toString()];

      if (!cond.field) {
        errors.push({
          field: 'field',
          code: 'MISSING_CONDITION_FIELD',
          message: 'Condition must specify target field.',
          severity: 'error',
          path: [...path, 'field'],
        });
      }

      if (!cond.operator) {
        errors.push({
          field: 'operator',
          code: 'MISSING_CONDITION_OPERATOR',
          message: 'Condition must specify comparison operator.',
          severity: 'error',
          path: [...path, 'operator'],
        });
      } else if (!this.APPROVED_OPERATORS.includes(cond.operator)) {
        errors.push({
          field: 'operator',
          code: 'INVALID_CONDITION_OPERATOR',
          message: `Operator '${cond.operator}' is not supported. Use: ${this.APPROVED_OPERATORS.join(', ')}`,
          severity: 'error',
          path: [...path, 'operator'],
        });
      }

      if (cond.value === undefined && cond.operator !== 'exists') {
        errors.push({
          field: 'value',
          code: 'MISSING_CONDITION_VALUE',
          message: "Condition value is required unless operator is 'exists'.",
          severity: 'error',
          path: [...path, 'value'],
        });
      }
    });
  }

  private validateActions(
    actions: WorkflowAction[] | undefined,
    errors: ValidationErrorDetail[],
  ) {
    if (!actions || actions.length === 0) {
      errors.push({
        field: 'actions',
        code: 'EMPTY_ACTIONS_LIST',
        message: 'Workflow must contain at least one step action to execute.',
        severity: 'error',
        path: ['actions'],
      });
      return;
    }

    if (!Array.isArray(actions)) {
      errors.push({
        field: 'actions',
        code: 'INVALID_ACTIONS_FORMAT',
        message: 'Actions property must be an array.',
        severity: 'error',
        path: ['actions'],
      });
      return;
    }

    const seenIds = new Set<string>();

    actions.forEach((action, index) => {
      const path = ['actions', index.toString()];

      if (!action.id) {
        errors.push({
          field: 'id',
          code: 'MISSING_ACTION_ID',
          message: 'Action step must specify a unique identifier ID.',
          severity: 'error',
          path: [...path, 'id'],
        });
      } else {
        if (seenIds.has(action.id)) {
          errors.push({
            field: 'id',
            code: 'DUPLICATE_ACTION_ID',
            message: `Duplicate action ID '${action.id}' found.`,
            severity: 'error',
            path: [...path, 'id'],
          });
        }
        seenIds.add(action.id);
      }

      if (!action.name) {
        errors.push({
          field: 'name',
          code: 'MISSING_ACTION_NAME',
          message: 'Action step must specify a descriptive name.',
          severity: 'error',
          path: [...path, 'name'],
        });
      }

      if (!action.type) {
        errors.push({
          field: 'type',
          code: 'MISSING_ACTION_TYPE',
          message: 'Action type is required.',
          severity: 'error',
          path: [...path, 'type'],
        });
      } else if (!Object.values(WorkflowStepType).includes(action.type)) {
        errors.push({
          field: 'type',
          code: 'INVALID_ACTION_TYPE',
          message: `Action type '${action.type}' is not supported.`,
          severity: 'error',
          path: [...path, 'type'],
        });
      }

      if (!action.configuration || typeof action.configuration !== 'object') {
        errors.push({
          field: 'configuration',
          code: 'MISSING_ACTION_CONFIGURATION',
          message: 'Action step must contain a configuration payload object.',
          severity: 'error',
          path: [...path, 'configuration'],
        });
      }

      if (action.sortOrder === undefined) {
        errors.push({
          field: 'sortOrder',
          code: 'MISSING_ACTION_SORT_ORDER',
          message: 'Action sort order sequence index is required.',
          severity: 'error',
          path: [...path, 'sortOrder'],
        });
      }
    });
  }

  private validateVariables(
    variables: WorkflowVariableDefinition[] | undefined,
    errors: ValidationErrorDetail[],
  ) {
    if (!variables) return;

    if (!Array.isArray(variables)) {
      errors.push({
        field: 'variables',
        code: 'INVALID_VARIABLES_FORMAT',
        message: 'Variables property must be an array.',
        severity: 'error',
        path: ['variables'],
      });
      return;
    }

    const seenKeys = new Set<string>();

    variables.forEach((variable, index) => {
      const path = ['variables', index.toString()];

      if (!variable.key) {
        errors.push({
          field: 'key',
          code: 'MISSING_VARIABLE_KEY',
          message: 'Variable must specify a key name identifier.',
          severity: 'error',
          path: [...path, 'key'],
        });
      } else {
        if (seenKeys.has(variable.key)) {
          errors.push({
            field: 'key',
            code: 'DUPLICATE_VARIABLE_KEY',
            message: `Duplicate variable key '${variable.key}' found.`,
            severity: 'error',
            path: [...path, 'key'],
          });
        }
        seenKeys.add(variable.key);
      }

      if (!variable.type) {
        errors.push({
          field: 'type',
          code: 'MISSING_VARIABLE_TYPE',
          message: 'Variable type is required.',
          severity: 'error',
          path: [...path, 'type'],
        });
      } else if (!Object.values(WorkflowVariableType).includes(variable.type)) {
        errors.push({
          field: 'type',
          code: 'INVALID_VARIABLE_TYPE',
          message: `Variable type '${variable.type}' is not supported.`,
          severity: 'error',
          path: [...path, 'type'],
        });
      }
    });
  }

  private validateFallback(
    fallback: Record<string, any> | undefined,
    errors: ValidationErrorDetail[],
  ) {
    if (!fallback) return;

    if (typeof fallback !== 'object') {
      errors.push({
        field: 'fallback',
        code: 'INVALID_FALLBACK_FORMAT',
        message: 'Fallback property must be an object.',
        severity: 'error',
        path: ['fallback'],
      });
      return;
    }

    if (
      fallback.type &&
      !Object.values(WorkflowStepType).includes(
        fallback.type as WorkflowStepType,
      )
    ) {
      errors.push({
        field: 'fallback.type',
        code: 'INVALID_FALLBACK_TYPE',
        message: `Fallback step type '${fallback.type}' is not supported.`,
        severity: 'error',
        path: ['fallback', 'type'],
      });
    }
  }

  private validateReferences(
    definition: Partial<WorkflowDefinition>,
    errors: ValidationErrorDetail[],
  ) {
    const actions = definition.actions || [];
    const declaredVariables = new Set(
      (definition.variables || []).map((v) => v.key),
    );

    actions.forEach((action, index) => {
      if (!action.configuration) return;
      const path = ['actions', index.toString(), 'configuration'];

      // Regex matching variable interpolation strings like {{var_key}} or {{variables.var_key}}
      const stringifiedConfig = JSON.stringify(action.configuration);
      const matches = stringifiedConfig.match(/\{\{([a-zA-Z0-9_\-.]+)\}\}/g);

      if (matches) {
        matches.forEach((match) => {
          const varName = match.replace(/\{\{|\}\}/g, '').trim();

          // We allow standard context payloads (like lead.*, user.*, tenant.*) without declaration
          const isStandardCtx =
            varName.startsWith('lead.') ||
            varName.startsWith('user.') ||
            varName.startsWith('tenant.') ||
            varName.startsWith('event.');

          if (!isStandardCtx && !declaredVariables.has(varName)) {
            errors.push({
              field: 'configuration',
              code: 'UNDECLARED_VARIABLE_REFERENCE',
              message: `Action references variable '${varName}' which is not declared in the workflow variables schema.`,
              severity: 'warning', // Severity warning to prevent blocking draft edits but flag to user
              path,
            });
          }
        });
      }
    });
  }
}
