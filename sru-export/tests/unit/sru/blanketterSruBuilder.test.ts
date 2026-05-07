import { describe, it, expect } from 'vitest';
import { buildBlanketterSruWithDate } from '../../../src/sru/blanketterSruBuilder';
import {
  makeMinimalDeclaration,
  makeInk1K4Declaration,
  makeInk1K10Declaration,
  makeInk1NeDeclaration,
} from '../../fixtures/validDeclaration';

const FILING_DATE = '20260401';
const FILING_TIME = '143022';

describe('buildBlanketterSruWithDate', () => {
  it('starts with #BLANKETT INK1-2025P4 (type code with year suffix)', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    const firstLine = result.split('\n')[0];
    expect(firstLine).toBe('#BLANKETT INK1-2025P4');
  });

  it('has #IDENTITET on line 2 (no #PERIOD in blankett block per SKV 269)', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    const lines = result.split('\n');
    expect(lines[1]).toMatch(/^#IDENTITET /);
  });

  it('contains #IDENTITET with personnummer, date AND time', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result).toContain('#IDENTITET 199001011234 20260401 143022');
  });

  it('contains #NAMN with formatted name', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result).toContain('#NAMN Svensson, Anna');
  });

  it('contains #UPPGIFT lines for each field', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result).toContain('#UPPGIFT 7011 450000');
    expect(result).toContain('#UPPGIFT 1070 450000');
  });

  it('contains #BLANKETTSLUT after fields', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result).toContain('#BLANKETTSLUT');
  });

  it('ends with #FIL_SLUT', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result.trimEnd().endsWith('#FIL_SLUT')).toBe(true);
  });

  it('sorts fields by code ascending', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    const uppgiftLines = result
      .split('\n')
      .filter((l) => l.startsWith('#UPPGIFT'));
    const codes = uppgiftLines.map((l) => l.split(' ')[1]);
    const sorted = [...codes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    expect(codes).toEqual(sorted);
  });

  it('uses INK1-2025P4 and K4-2025 codes (type-year format per SKV 269)', () => {
    const result = buildBlanketterSruWithDate(makeInk1K4Declaration(), FILING_DATE, FILING_TIME);
    const blankettLines = result
      .split('\n')
      .filter((l) => l.startsWith('#BLANKETT '));
    expect(blankettLines[0]).toBe('#BLANKETT INK1-2025P4');
    expect(blankettLines[1]).toBe('#BLANKETT K4-2025P4');
  });

  it('uses K10-2025 code for K10 blankett', () => {
    const result = buildBlanketterSruWithDate(makeInk1K10Declaration(), FILING_DATE, FILING_TIME);
    const blankettLines = result
      .split('\n')
      .filter((l) => l.startsWith('#BLANKETT '));
    expect(blankettLines[0]).toBe('#BLANKETT INK1-2025P4');
    expect(blankettLines[1]).toBe('#BLANKETT K10-2025P4');
  });

  it('uses NE-2025 code for NE blankett', () => {
    const result = buildBlanketterSruWithDate(makeInk1NeDeclaration(), FILING_DATE, FILING_TIME);
    expect(result).toContain('#BLANKETT NE-2025P4');
    expect(result).toContain('#UPPGIFT 5010 300000');
    expect(result).toContain('#UPPGIFT 5140 120000');
  });

  it('skips fields with empty string values', () => {
    const decl = makeMinimalDeclaration({
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 450000 },
            { code: '7012', value: '' },
          ],
        },
      ],
    });
    const result = buildBlanketterSruWithDate(decl, FILING_DATE, FILING_TIME);
    expect(result).not.toContain('#UPPGIFT 7012');
  });

  it('filters fields not in allowedFieldCodes', () => {
    const decl = makeMinimalDeclaration({
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: 450000 },
            { code: '9999', value: 100 }, // not in INK1 allowed codes
          ],
        },
      ],
    });
    const result = buildBlanketterSruWithDate(decl, FILING_DATE, FILING_TIME);
    expect(result).toContain('#UPPGIFT 7011 450000');
    expect(result).not.toContain('#UPPGIFT 9999');
  });

  it('uses LF line endings (not CRLF)', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    expect(result.includes('\r')).toBe(false);
  });

  it('throws when no identity number', () => {
    const decl = makeMinimalDeclaration({
      taxpayer: { firstName: 'No', lastName: 'Id' },
    });
    expect(() => buildBlanketterSruWithDate(decl, FILING_DATE, FILING_TIME)).toThrow(
      'no identity number'
    );
  });

  it('throws when blankett period token is unknown', () => {
    const decl = makeMinimalDeclaration({
      forms: [
        {
          formType: 'UNKNOWN_FORM',
          instanceNumber: 1,
          fields: [{ code: '1000', value: 100 }],
        },
      ],
    });
    expect(() => buildBlanketterSruWithDate(decl, FILING_DATE, FILING_TIME)).toThrow(
      'Okänd blanketttyp'
    );
  });

  it('fails if no field values exist (all empty)', () => {
    const decl = makeMinimalDeclaration({
      forms: [
        {
          formType: 'INK1',
          instanceNumber: 1,
          fields: [
            { code: '7011', value: '' },
            { code: '1070', value: '' },
          ],
        },
      ],
    });
    const result = buildBlanketterSruWithDate(decl, FILING_DATE, FILING_TIME);
    // Should still produce valid structure but no UPPGIFT lines
    expect(result).not.toContain('#UPPGIFT');
    // Structure is still valid
    expect(result).toContain('#BLANKETT');
    expect(result).toContain('#BLANKETTSLUT');
    expect(result).toContain('#FIL_SLUT');
  });

  it('defaults filing time to 120000 if omitted', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE);
    expect(result).toContain('#IDENTITET 199001011234 20260401 120000');
  });
});
