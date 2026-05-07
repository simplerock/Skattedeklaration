import { describe, it, expect } from 'vitest';
import { validateForms } from '../../../src/validation/validateForms';
import { ErrorCodes } from '../../../src/validation/validationErrors';
import { makeMinimalDeclaration } from '../../fixtures/validDeclaration';
import type { Declaration } from '../../../src/domain/declaration';

describe('validateForms', () => {
  it('passes for a valid INK1 declaration', () => {
    const decl = makeMinimalDeclaration();
    const result = validateForms(decl);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when no INK1 form present', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3100', value: 'test' }] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors.some((e) => e.code === ErrorCodes.MISSING_INK1)).toBe(true);
  });

  it('errors when multiple INK1 forms exist', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'INK1', instanceNumber: 2, fields: [{ code: '7011', value: 200 }] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors.some((e) => e.code === ErrorCodes.MULTIPLE_INK1)).toBe(true);
  });

  it('errors when a form has empty fields', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors.some((e) => e.code === ErrorCodes.EMPTY_FORM_FIELDS)).toBe(true);
  });

  it('accepts K4 alongside INK1', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3100', value: 'test' }] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts K10 alongside INK1', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'K10', instanceNumber: 1, fields: [{ code: '8020', value: 180000 }] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts NE alongside INK1', () => {
    const decl: Declaration = {
      ...makeMinimalDeclaration(),
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'NE', instanceNumber: 1, fields: [{ code: '5010', value: 300000 }] },
      ],
    };
    const result = validateForms(decl);
    expect(result.errors).toHaveLength(0);
  });
});
