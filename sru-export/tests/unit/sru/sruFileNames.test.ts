import { describe, it, expect } from 'vitest';
import {
  assertValidSruFileName,
  getSruFileName,
  SRU_FILE_NAMES,
} from '../../../src/sru/sruFileNames';

describe('assertValidSruFileName', () => {
  it('accepts INFO.SRU', () => {
    expect(() => assertValidSruFileName('INFO.SRU')).not.toThrow();
  });

  it('accepts BLANKETTER.SRU', () => {
    expect(() => assertValidSruFileName('BLANKETTER.SRU')).not.toThrow();
  });

  it('rejects lowercase info.sru', () => {
    expect(() => assertValidSruFileName('info.sru')).toThrow('Invalid SRU filename');
  });

  it('rejects arbitrary filenames', () => {
    expect(() => assertValidSruFileName('data.txt')).toThrow('Invalid SRU filename');
  });

  it('rejects empty string', () => {
    expect(() => assertValidSruFileName('')).toThrow('Invalid SRU filename');
  });
});

describe('getSruFileName', () => {
  it('returns INFO.SRU for INFO type', () => {
    expect(getSruFileName('INFO')).toBe('INFO.SRU');
  });

  it('returns BLANKETTER.SRU for BLANKETTER type', () => {
    expect(getSruFileName('BLANKETTER')).toBe('BLANKETTER.SRU');
  });
});

describe('SRU_FILE_NAMES', () => {
  it('has exactly two entries', () => {
    expect(Object.keys(SRU_FILE_NAMES)).toHaveLength(2);
  });
});
