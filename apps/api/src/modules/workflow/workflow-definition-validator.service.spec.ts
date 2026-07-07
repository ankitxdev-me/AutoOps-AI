import { WorkflowDefinitionValidator } from './workflow-definition-validator.service';
import {
  WorkflowTriggerType,
  WorkflowVariableType,
  WorkflowStepType,
} from '@prisma/client';

describe('WorkflowDefinitionValidator', () => {
  let validator: WorkflowDefinitionValidator;

  beforeEach(() => {
    validator = new WorkflowDefinitionValidator();
  });

  it('should be defined', () => {
    expect(validator).toBeDefined();
  });

  it('should successfully validate a correct workflow definition', () => {
    const result = validator.validate({
      trigger: {
        type: WorkflowTriggerType.LEAD_CREATED,
        configuration: {},
      },
      conditions: [
        {
          field: 'lead.budget',
          operator: 'gte',
          value: 5000,
        },
      ],
      actions: [
        {
          id: 'action-1',
          name: 'Send Confirmation Email',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {
            template: 'welcome',
            to: '{{lead.email}}',
          },
          sortOrder: 1,
        },
      ],
      variables: [
        {
          key: 'lead.email',
          type: WorkflowVariableType.STRING,
        },
      ],
      fallback: {},
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should fail if trigger is missing or type is invalid', () => {
    const result = validator.validate({
      actions: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_TRIGGER')).toBe(true);

    const result2 = validator.validate({
      trigger: {
        type: 'INVALID_TRIGGER_TYPE' as unknown as WorkflowTriggerType,
      },
      actions: [],
    });

    expect(result2.isValid).toBe(false);
    expect(result2.errors.some((e) => e.code === 'INVALID_TRIGGER_TYPE')).toBe(
      true,
    );
  });

  it('should fail if conditions contain unknown operators', () => {
    const result = validator.validate({
      trigger: { type: WorkflowTriggerType.MANUAL_RUN },
      conditions: [
        {
          field: 'budget',
          operator: 'invalid_op' as unknown as 'eq',
          value: 1000,
        },
      ],
      actions: [
        {
          id: 'act-1',
          name: 'Action',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {},
          sortOrder: 1,
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.code === 'INVALID_CONDITION_OPERATOR'),
    ).toBe(true);
  });

  it('should fail if action steps are missing, contain duplicate IDs, or have invalid types', () => {
    const resultEmpty = validator.validate({
      trigger: { type: WorkflowTriggerType.MANUAL_RUN },
      actions: [],
    });

    expect(resultEmpty.isValid).toBe(false);
    expect(
      resultEmpty.errors.some((e) => e.code === 'EMPTY_ACTIONS_LIST'),
    ).toBe(true);

    const resultDuplicate = validator.validate({
      trigger: { type: WorkflowTriggerType.MANUAL_RUN },
      actions: [
        {
          id: 'step-1',
          name: 'First step',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {},
          sortOrder: 1,
        },
        {
          id: 'step-1',
          name: 'Second step with duplicate ID',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {},
          sortOrder: 2,
        },
      ],
    });

    expect(resultDuplicate.isValid).toBe(false);
    expect(
      resultDuplicate.errors.some((e) => e.code === 'DUPLICATE_ACTION_ID'),
    ).toBe(true);
  });

  it('should flag a warning when actions reference undeclared variables', () => {
    const result = validator.validate({
      trigger: { type: WorkflowTriggerType.MANUAL_RUN },
      actions: [
        {
          id: 'step-1',
          name: 'First step',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {
            text: 'Hello {{undeclared_var}}',
          },
          sortOrder: 1,
        },
      ],
      variables: [],
    });

    expect(result.isValid).toBe(true); // Warning severity does not block isValid
    expect(
      result.errors.some((e) => e.code === 'UNDECLARED_VARIABLE_REFERENCE'),
    ).toBe(true);
    expect(result.errors[0].severity).toBe('warning');
  });

  it('should not flag warning for standard context variables like lead.* or user.*', () => {
    const result = validator.validate({
      trigger: { type: WorkflowTriggerType.MANUAL_RUN },
      actions: [
        {
          id: 'step-1',
          name: 'First step',
          type: WorkflowStepType.TOOL_CALL,
          configuration: {
            email: 'Send to {{lead.email}} by {{user.name}}',
          },
          sortOrder: 1,
        },
      ],
      variables: [],
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
