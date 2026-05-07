import { describe, it, expect } from 'vitest';
import { buildInfoSru } from '../../src/sru/infoSruBuilder';
import { buildBlanketterSruWithDate } from '../../src/sru/blanketterSruBuilder';
import { makeMinimalDeclaration, makeInk1K4Declaration } from '../fixtures/validDeclaration';

const FILING_DATE = '20260401';
const FILING_TIME = '120000';
const NOW_ISO = '20260401';  // YYYYMMDD — no time component
const LF = '\n';

describe('INFO.SRU snapshot', () => {
  it('matches expected output for minimal declaration', () => {
    const result = buildInfoSru(makeMinimalDeclaration(), NOW_ISO);
    const expected = [
      '#DATABESKRIVNING_START',
      '#PRODUKT SRU',
      '#SKAPAD 20260401',
      '#PROGRAM Deklarationsformularet 1.0',
      '#FILNAMN BLANKETTER.SRU',
      '#DATABESKRIVNING_SLUT',
      '#MEDIELEV_START',
      '#ORGNR 199001011234',
      '#NAMN Svensson, Anna',
      '#POSTNR 11122',
      '#KONTAKT Svensson, Anna',
      '#MEDIELEV_SLUT',
    ].join(LF) + LF;
    expect(result).toBe(expected);
  });

  it('matches expected output with address fields', () => {
    const result = buildInfoSru(makeInk1K4Declaration(), NOW_ISO);
    const expected = [
      '#DATABESKRIVNING_START',
      '#PRODUKT SRU',
      '#SKAPAD 20260401',
      '#PROGRAM Deklarationsformularet 1.0',
      '#FILNAMN BLANKETTER.SRU',
      '#DATABESKRIVNING_SLUT',
      '#MEDIELEV_START',
      '#ORGNR 198505152345',
      '#NAMN Johansson, Erik',
      '#ADRESS Storgatan 1',
      '#POSTNR 11122',
      '#POSTORT Stockholm',
      '#KONTAKT Johansson, Erik',
      '#MEDIELEV_SLUT',
    ].join(LF) + LF;
    expect(result).toBe(expected);
  });
});

describe('BLANKETTER.SRU snapshot', () => {
  it('matches expected output for minimal INK1', () => {
    const result = buildBlanketterSruWithDate(makeMinimalDeclaration(), FILING_DATE, FILING_TIME);
    const expected = [
      '#BLANKETT INK1-2025P4',
      '#IDENTITET 199001011234 20260401 120000',
      '#NAMN Svensson, Anna',
      '#UPPGIFT 1070 450000',
      '#UPPGIFT 7011 450000',
      '#BLANKETTSLUT',
      '#FIL_SLUT',
    ].join(LF) + LF;
    expect(result).toBe(expected);
  });

  it('matches expected output for INK1 + K4', () => {
    const result = buildBlanketterSruWithDate(makeInk1K4Declaration(), FILING_DATE, FILING_TIME);
    const expected = [
      '#BLANKETT INK1-2025P4',
      '#IDENTITET 198505152345 20260401 120000',
      '#NAMN Johansson, Erik',
      '#UPPGIFT 1070 550000',
      '#UPPGIFT 7011 550000',
      '#UPPGIFT 7510 35000',
      '#BLANKETTSLUT',
      '#BLANKETT K4-2025P4',
      '#IDENTITET 198505152345 20260401 120000',
      '#NAMN Johansson, Erik',
      '#UPPGIFT 3100 100',
      '#UPPGIFT 3101 Volvo B',
      '#UPPGIFT 3103 50000',
      '#UPPGIFT 3104 15000',
      '#UPPGIFT 3105 35000',
      '#BLANKETTSLUT',
      '#FIL_SLUT',
    ].join(LF) + LF;
    expect(result).toBe(expected);
  });
});
