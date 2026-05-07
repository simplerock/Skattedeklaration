import { describe, it, expect } from 'vitest';
import { validateCrossChecks } from '../../../src/validation/validateCrossChecks';
import { ErrorCodes } from '../../../src/validation/validationErrors';
import type { Declaration } from '../../../src/domain/declaration';

describe('validateCrossChecks', () => {
  it('returns no errors for INK1-only declaration', () => {
    const decl: Declaration = {
      taxpayer: { personalIdentityNumber: '199001011234', firstName: 'A', lastName: 'B' },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
      ],
    };
    expect(validateCrossChecks(decl)).toHaveLength(0);
  });

  it('errors when K4 present but INK1 has no capital field', () => {
    const decl: Declaration = {
      taxpayer: { personalIdentityNumber: '199001011234', firstName: 'A', lastName: 'B' },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3105', value: 35000 }] },
      ],
    };
    const errors = validateCrossChecks(decl);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe(ErrorCodes.CROSS_CHECK_MISMATCH);
    expect(errors[0].message).toContain('7510/7520');
  });

  it('passes when K4 present and INK1 has 7510 (överskott av kapital)', () => {
    const decl: Declaration = {
      taxpayer: { personalIdentityNumber: '199001011234', firstName: 'A', lastName: 'B' },
      incomeTaxYear: 2025,
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 100 },
            { code: '7510', value: 35000 },
          ],
        },
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3105', value: 35000 }] },
      ],
    };
    expect(validateCrossChecks(decl)).toHaveLength(0);
  });

  it('passes when K4 present and INK1 has 7520 (underskott av kapital)', () => {
    const decl: Declaration = {
      taxpayer: { personalIdentityNumber: '199001011234', firstName: 'A', lastName: 'B' },
      incomeTaxYear: 2025,
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 100 },
            { code: '7520', value: 5000 },
          ],
        },
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3106', value: 5000 }] },
      ],
    };
    expect(validateCrossChecks(decl)).toHaveLength(0);
  });

  it('returns no errors for K10 (soft check, no hard error)', () => {
    const decl: Declaration = {
      taxpayer: { personalIdentityNumber: '199001011234', firstName: 'A', lastName: 'B' },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'K10', instanceNumber: 1, fields: [{ code: '8020', value: 180000 }] },
      ],
    };
    expect(validateCrossChecks(decl)).toHaveLength(0);
  });
});
