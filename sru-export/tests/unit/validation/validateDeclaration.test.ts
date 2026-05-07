import { describe, it, expect } from 'vitest';
import { validateDeclarationSchema } from '../../../src/validation/validateDeclaration';
import { ErrorCodes } from '../../../src/validation/validationErrors';
import { makeRawValidInput } from '../../fixtures/validDeclaration';

describe('validateDeclarationSchema', () => {
  it('accepts a valid minimal declaration', () => {
    const result = validateDeclarationSchema(makeRawValidInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.taxpayer.firstName).toBe('Anna');
      expect(result.data.incomeTaxYear).toBe(2025);
    }
  });

  it('rejects null input', () => {
    const result = validateDeclarationSchema(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe(ErrorCodes.SCHEMA_VALIDATION_FAILED);
    }
  });

  it('rejects empty object', () => {
    const result = validateDeclarationSchema({});
    expect(result.success).toBe(false);
  });

  it('rejects missing taxpayer', () => {
    const result = validateDeclarationSchema({
      incomeTaxYear: 2025,
      forms: [{ formType: 'INK1', instanceNumber: 1, fields: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid personnummer format', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        personalIdentityNumber: '123', // too short
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [{ formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.message.includes('Personnummer'))).toBe(true);
    }
  });

  it('rejects missing identity number (no personnummer or orgnummer)', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [{ formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts organisationsnummer instead of personnummer', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        organisationNumber: '5566778899',
        firstName: 'AB',
        lastName: 'Testbolaget',
      },
      incomeTaxYear: 2025,
      forms: [{ formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects income tax year below 2000', () => {
    const input = makeRawValidInput() as Record<string, unknown>;
    input.incomeTaxYear = 1999;
    const result = validateDeclarationSchema(input);
    expect(result.success).toBe(false);
  });

  it('rejects empty forms array', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsupported form type at schema level', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [{ formType: 'K99', instanceNumber: 1, fields: [] }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects field code that is not 3-5 digits', () => {
    const result = validateDeclarationSchema({
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [{ code: 'AB', value: 100 }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
