import { describe, it, expect } from 'vitest';
import {
  getFormMapping,
  isFormTypeRegistered,
  getRegisteredFormTypes,
} from '../../../src/mappings/formRegistry';

describe('formRegistry', () => {
  it('has INK1 registered', () => {
    expect(isFormTypeRegistered('INK1')).toBe(true);
  });

  it('has K4 registered', () => {
    expect(isFormTypeRegistered('K4')).toBe(true);
  });

  it('has K10 registered', () => {
    expect(isFormTypeRegistered('K10')).toBe(true);
  });

  it('has NE registered', () => {
    expect(isFormTypeRegistered('NE')).toBe(true);
  });

  it('returns false for unknown type', () => {
    expect(isFormTypeRegistered('K99')).toBe(false);
  });

  it('getFormMapping returns mapping with correct formType', () => {
    const mapping = getFormMapping('INK1');
    expect(mapping).toBeDefined();
    expect(mapping!.formType).toBe('INK1');
    expect(mapping!.blankettCode).toBe('INK1');
  });

  it('getFormMapping returns undefined for unknown type', () => {
    expect(getFormMapping('BOGUS')).toBeUndefined();
  });

  it('getRegisteredFormTypes returns all 4 types', () => {
    const types = getRegisteredFormTypes();
    expect(types).toHaveLength(4);
    expect(types).toContain('INK1');
    expect(types).toContain('K4');
    expect(types).toContain('K10');
    expect(types).toContain('NE');
  });
});

describe('INK1 mapping', () => {
  it('has allowedFieldCodes', () => {
    const m = getFormMapping('INK1')!;
    expect(m.allowedFieldCodes).toBeDefined();
    expect(m.allowedFieldCodes!.length).toBeGreaterThan(10);
  });

  it('includes key field codes', () => {
    const m = getFormMapping('INK1')!;
    const codes = m.allowedFieldCodes!;
    expect(codes).toContain('7011'); // Lön
    expect(codes).toContain('1070'); // Summa tjänst
    expect(codes).toContain('7510'); // Överskott kapital
    expect(codes).toContain('1010'); // Resor till arbetet
  });
});

describe('K4 mapping', () => {
  it('includes section A fields', () => {
    const m = getFormMapping('K4')!;
    expect(m.allowedFieldCodes).toContain('3100');
    expect(m.allowedFieldCodes).toContain('3105');
    expect(m.allowedFieldCodes).toContain('3106');
  });
});

describe('K10 mapping', () => {
  it('includes gränsbelopp field', () => {
    const m = getFormMapping('K10')!;
    expect(m.allowedFieldCodes).toContain('8020');
  });
});

describe('NE mapping', () => {
  it('includes nettoomsättning field', () => {
    const m = getFormMapping('NE')!;
    expect(m.allowedFieldCodes).toContain('5010');
  });
});
