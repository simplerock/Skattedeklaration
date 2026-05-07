import { describe, it, expect } from 'vitest';
import { generateSruPackage } from '../../src/application/generateSruPackage';
import { ErrorCodes } from '../../src/validation/validationErrors';

const FILING_DATE = '20260401';

function validInput() {
  return {
    taxpayer: {
      personalIdentityNumber: '199001011234',
      firstName: 'Anna',
      lastName: 'Svensson',
      postalCode: '11122',
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [
          { code: '7011', value: 450000 },
          { code: '1070', value: 450000 },
        ],
      },
    ],
  };
}

describe('generateSruPackage — happy path', () => {
  it('returns success for minimal valid input', () => {
    const result = generateSruPackage(validInput(), FILING_DATE);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('produces exactly 2 files', () => {
    const result = generateSruPackage(validInput(), FILING_DATE);
    expect(result.files).toHaveLength(2);
  });

  it('produces INFO.SRU and BLANKETTER.SRU', () => {
    const result = generateSruPackage(validInput(), FILING_DATE);
    const names = result.files.map((f) => f.name);
    expect(names).toContain('INFO.SRU');
    expect(names).toContain('BLANKETTER.SRU');
  });

  it('INFO.SRU contains correct structure', () => {
    const result = generateSruPackage(validInput(), FILING_DATE);
    const info = result.files.find((f) => f.name === 'INFO.SRU')!;
    expect(info.content).toContain('#DATABESKRIVNING_START');
    expect(info.content).toContain('#PRODUKT SRU');
    expect(info.content).toContain('#ORGNR 199001011234');
    expect(info.content).toContain('#NAMN Svensson, Anna');
    expect(info.content).toContain('#MEDIELEV_SLUT');
    expect(info.content).not.toContain('#PERIOD');
  });

  it('BLANKETTER.SRU contains form data', () => {
    const result = generateSruPackage(validInput(), FILING_DATE);
    const blanketter = result.files.find((f) => f.name === 'BLANKETTER.SRU')!;
    expect(blanketter.content).toContain('#BLANKETT INK1');
    expect(blanketter.content).toContain('#UPPGIFT 7011 450000');
  });
});

describe('generateSruPackage — INK1 + K4', () => {
  it('succeeds when K4 present with INK1 capital fields', () => {
    const input = {
      ...validInput(),
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 550000 },
            { code: '7510', value: 35000 },
          ],
        },
        {
          formType: 'K4',
          instanceNumber: 1,
          fields: [
            { code: '3105', value: 35000 },
          ],
        },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
  });

  it('fails when K4 present but INK1 missing capital fields', () => {
    const input = {
      ...validInput(),
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [{ code: '7011', value: 550000 }],
        },
        {
          formType: 'K4',
          instanceNumber: 1,
          fields: [{ code: '3105', value: 35000 }],
        },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === ErrorCodes.CROSS_CHECK_MISMATCH)).toBe(true);
  });
});

describe('generateSruPackage — INK1 + K10', () => {
  it('succeeds with K10 form', () => {
    const input = {
      ...validInput(),
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 600000 },
            { code: '7510', value: 200000 },
          ],
        },
        {
          formType: 'K10',
          instanceNumber: 1,
          fields: [{ code: '8020', value: 180000 }],
        },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(true);
  });
});

describe('generateSruPackage — INK1 + NE', () => {
  it('succeeds with NE form', () => {
    const input = {
      ...validInput(),
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7610', value: 120000 },
            { code: '1070', value: 120000 },
          ],
        },
        {
          formType: 'NE',
          instanceNumber: 1,
          fields: [
            { code: '5010', value: 300000 },
            { code: '5110', value: 120000 },
          ],
        },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(true);
  });
});

describe('generateSruPackage — validation errors', () => {
  it('fails on null input', () => {
    const result = generateSruPackage(null, FILING_DATE);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fails on empty object', () => {
    const result = generateSruPackage({}, FILING_DATE);
    expect(result.success).toBe(false);
  });

  it('fails with invalid personnummer', () => {
    const input = {
      taxpayer: {
        personalIdentityNumber: '12345',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(false);
  });

  it('fails when no INK1 form present', () => {
    const input = {
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'K4', instanceNumber: 1, fields: [{ code: '3105', value: 1000 }] },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === ErrorCodes.MISSING_INK1)).toBe(true);
  });

  it('fails when INK1 has no fields', () => {
    const input = {
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [] },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === ErrorCodes.EMPTY_FORM_FIELDS)).toBe(true);
  });

  it('fails with multiple INK1 forms', () => {
    const input = {
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Test',
        lastName: 'Test',
      },
      incomeTaxYear: 2025,
      forms: [
        { formType: 'INK1', instanceNumber: 1, fields: [{ code: '7011', value: 100 }] },
        { formType: 'INK1', instanceNumber: 2, fields: [{ code: '7011', value: 200 }] },
      ],
    };
    const result = generateSruPackage(input, FILING_DATE);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.code === ErrorCodes.MULTIPLE_INK1)).toBe(true);
  });

  it('never throws — always returns a result', () => {
    // Feed garbage input and verify no exception
    expect(() => generateSruPackage(undefined, FILING_DATE)).not.toThrow();
    expect(() => generateSruPackage('garbage', FILING_DATE)).not.toThrow();
    expect(() => generateSruPackage(42, FILING_DATE)).not.toThrow();
    expect(() => generateSruPackage([], FILING_DATE)).not.toThrow();
  });
});

describe('generateSruPackage — determinism', () => {
  it('produces identical output for same input', () => {
    const input = validInput();
    const result1 = generateSruPackage(input, FILING_DATE);
    const result2 = generateSruPackage(input, FILING_DATE);
    expect(result1.files[0].content).toBe(result2.files[0].content);
    expect(result1.files[1].content).toBe(result2.files[1].content);
  });
});
