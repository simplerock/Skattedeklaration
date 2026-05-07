import { describe, it, expect } from 'vitest';
import { buildInfoSru } from '../../../src/sru/infoSruBuilder';
import { makeMinimalDeclaration, makeInk1K4Declaration } from '../../fixtures/validDeclaration';

const NOW_ISO = '20260401';  // YYYYMMDD only — no time

describe('buildInfoSru', () => {
  it('contains #DATABESKRIVNING_START as first line', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    const firstLine = result.split('\n')[0];
    expect(firstLine).toBe('#DATABESKRIVNING_START');
  });

  it('contains #PRODUKT SRU (no year suffix)', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#PRODUKT SRU\n');
    // Must NOT contain SRU2025 or similar
    expect(result).not.toMatch(/#PRODUKT SRU\d/);
  });

  it('contains #SKAPAD with date only (YYYYMMDD)', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#SKAPAD 20260401');
    // Must NOT contain time component — Skatteverket rejects YYYYMMDDHHMMSS
    expect(result).not.toContain('#SKAPAD 20260401120000');
  });

  it('contains #PROGRAM line', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#PROGRAM Deklarationsformularet 1.0');
  });

  it('contains #FILNAMN BLANKETTER.SRU', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#FILNAMN BLANKETTER.SRU');
  });

  it('contains #DATABESKRIVNING_SLUT', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#DATABESKRIVNING_SLUT');
  });

  it('contains #MEDIELEV_START and #MEDIELEV_SLUT', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#MEDIELEV_START');
    expect(result).toContain('#MEDIELEV_SLUT');
  });

  it('contains #ORGNR with personnummer', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#ORGNR 199001011234');
  });

  it('contains #NAMN with formatted name', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#NAMN Svensson, Anna');
  });

  it('contains #KONTAKT (not #KONTAKTPERSON)', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#KONTAKT Svensson, Anna');
    expect(result).not.toContain('#KONTAKTPERSON');
  });

  it('does NOT contain #PERIOD', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).not.toContain('#PERIOD');
  });

  it('does NOT contain #MEDESSION', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).not.toContain('#MEDESSION');
  });

  it('does NOT contain #UPPGIFTSLAMNAREID', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).not.toContain('#UPPGIFTSLAMNAREID');
  });

  it('does NOT contain #FIL_SLUT', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).not.toContain('#FIL_SLUT');
  });

  it('ends with #MEDIELEV_SLUT', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result.trimEnd().endsWith('#MEDIELEV_SLUT')).toBe(true);
  });

  it('uses LF line endings (not CRLF)', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result.includes('\r')).toBe(false);
    const lines = result.split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThan(5);
  });

  it('includes address fields when provided', () => {
    const result = buildInfoSru(makeInk1K4Declaration(), NOW_ISO);
    expect(result).toContain('#ADRESS Storgatan 1');
    expect(result).toContain('#POSTNR 11122');
    expect(result).toContain('#POSTORT Stockholm');
  });

  it('always includes POSTNR — it is required by Skatteverket', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).toContain('#POSTNR 11122');
  });

  it('omits ADRESS and POSTORT when not provided', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    expect(result).not.toContain('#ADRESS');
    expect(result).not.toContain('#POSTORT');
  });

  it('throws when postal code is 00000', () => {
    const decl = makeMinimalDeclaration({
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Anna',
        lastName: 'Svensson',
        postalCode: '00000',
      },
    });
    expect(() => buildInfoSru(decl, NOW_ISO)).toThrow('postalCode is required');
  });

  it('throws when postal code is missing', () => {
    const decl = makeMinimalDeclaration({
      taxpayer: {
        personalIdentityNumber: '199001011234',
        firstName: 'Anna',
        lastName: 'Svensson',
        // no postalCode
      },
    });
    expect(() => buildInfoSru(decl, NOW_ISO)).toThrow('postalCode is required');
  });

  it('throws when no identity number', () => {
    const decl = makeMinimalDeclaration({
      taxpayer: {
        firstName: 'No',
        lastName: 'Id',
      },
    });
    expect(() => buildInfoSru(decl, NOW_ISO)).toThrow('no identity number');
  });
});
