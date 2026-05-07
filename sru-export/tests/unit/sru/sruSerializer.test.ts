import { describe, it, expect } from 'vitest';
import { serializeSruFile } from '../../../src/sru/sruSerializer';

describe('serializeSruFile', () => {
  it('returns an SruFile with name and content', () => {
    const file = serializeSruFile('INFO.SRU', '#PROGRAM Test\n#FIL_SLUT\n');
    expect(file.name).toBe('INFO.SRU');
    expect(file.content).toContain('#PROGRAM');
  });

  it('throws on invalid filename', () => {
    expect(() => serializeSruFile('bad.txt', 'content')).toThrow('Invalid SRU filename');
  });

  it('throws on empty content', () => {
    expect(() => serializeSruFile('INFO.SRU', '')).toThrow('empty content');
  });

  it('throws on whitespace-only content', () => {
    expect(() => serializeSruFile('INFO.SRU', '   \n  ')).toThrow('empty content');
  });

  it('accepts BLANKETTER.SRU', () => {
    const file = serializeSruFile('BLANKETTER.SRU', '#BLANKETT INK1\n');
    expect(file.name).toBe('BLANKETTER.SRU');
  });
});
