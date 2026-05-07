import { describe, it, expect } from 'vitest';
import {
  findNonLatin1Characters,
  sanitizeForLatin1,
  encodeToLatin1Buffer,
} from '../../../src/sru/sruEncoding';

describe('findNonLatin1Characters', () => {
  it('returns empty for pure ASCII', () => {
    expect(findNonLatin1Characters('Hello World')).toEqual([]);
  });

  it('returns empty for Swedish characters (within Latin-1)', () => {
    expect(findNonLatin1Characters('åäöÅÄÖ')).toEqual([]);
  });

  it('detects Chinese characters', () => {
    const result = findNonLatin1Characters('Hello 你好');
    expect(result).toContain('你');
    expect(result).toContain('好');
  });

  it('detects emoji', () => {
    const result = findNonLatin1Characters('Test 😀');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns unique characters only', () => {
    const result = findNonLatin1Characters('你你你');
    expect(result).toEqual(['你']);
  });
});

describe('sanitizeForLatin1', () => {
  it('preserves ASCII text', () => {
    expect(sanitizeForLatin1('Hello')).toBe('Hello');
  });

  it('preserves Swedish characters', () => {
    expect(sanitizeForLatin1('Hälsning från Malmö')).toBe('Hälsning från Malmö');
  });

  it('replaces non-Latin-1 with ?', () => {
    expect(sanitizeForLatin1('Hello 你好')).toBe('Hello ??');
  });
});

describe('encodeToLatin1Buffer', () => {
  it('returns a Buffer', () => {
    const buf = encodeToLatin1Buffer('Hello');
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('encodes Swedish characters correctly', () => {
    const buf = encodeToLatin1Buffer('åäö');
    expect(buf.length).toBe(3); // each char is 1 byte in Latin-1
  });
});
