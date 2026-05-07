import { describe, it, expect } from 'vitest';
import {
  sruLine,
  formatFieldValue,
  uppgiftLine,
  identitetLine,
  blankettLine,
  namnLine,
  joinLines,
} from '../../../src/sru/lineBuilder';

describe('sruLine', () => {
  it('builds a line with keyword only', () => {
    expect(sruLine('#FIL_SLUT')).toBe('#FIL_SLUT\n');
  });

  it('builds a line with keyword and one value', () => {
    expect(sruLine('#PROGRAM', 'TestApp')).toBe('#PROGRAM TestApp\n');
  });

  it('builds a line with keyword and multiple values', () => {
    expect(sruLine('#PROGRAM', 'TestApp', '1.0')).toBe('#PROGRAM TestApp 1.0\n');
  });

  it('always ends with LF', () => {
    const line = sruLine('#TEST', 'value');
    expect(line.endsWith('\n')).toBe(true);
    // No CR+LF — just LF
    expect(line.endsWith('\r\n')).toBe(false);
  });
});

describe('formatFieldValue', () => {
  it('formats number as rounded integer string', () => {
    expect(formatFieldValue(450000)).toBe('450000');
  });

  it('rounds decimal numbers', () => {
    expect(formatFieldValue(99.7)).toBe('100');
    expect(formatFieldValue(99.3)).toBe('99');
  });

  it('formats boolean true as "1"', () => {
    expect(formatFieldValue(true)).toBe('1');
  });

  it('formats boolean false as "0"', () => {
    expect(formatFieldValue(false)).toBe('0');
  });

  it('trims string values', () => {
    expect(formatFieldValue('  hello  ')).toBe('hello');
  });

  it('replaces newlines in strings', () => {
    expect(formatFieldValue('line1\nline2')).toBe('line1 line2');
    // \r\n → replace \r and \n separately → two spaces (expected behavior)
    expect(formatFieldValue('line1\r\nline2')).toBe('line1  line2');
  });
});

describe('uppgiftLine', () => {
  it('formats field code and numeric value', () => {
    expect(uppgiftLine('7011', 450000)).toBe('#UPPGIFT 7011 450000\n');
  });

  it('formats field code and string value', () => {
    expect(uppgiftLine('3101', 'Volvo B')).toBe('#UPPGIFT 3101 Volvo B\n');
  });
});

describe('identitetLine', () => {
  it('formats identity and date', () => {
    expect(identitetLine('199001011234', '20260401')).toBe(
      '#IDENTITET 199001011234 20260401\n'
    );
  });

  it('formats identity, date and time', () => {
    expect(identitetLine('199001011234', '20260401', '143022')).toBe(
      '#IDENTITET 199001011234 20260401 143022\n'
    );
  });
});

describe('blankettLine', () => {
  it('formats blankett type code', () => {
    expect(blankettLine('INK1S-2025P4')).toBe('#BLANKETT INK1S-2025P4\n');
  });
});

describe('namnLine', () => {
  it('formats surname, firstname', () => {
    expect(namnLine('Svensson', 'Anna')).toBe('#NAMN Svensson, Anna\n');
  });
});

describe('joinLines', () => {
  it('concatenates lines without adding extra separators', () => {
    const result = joinLines(['#A\n', '#B\n']);
    expect(result).toBe('#A\n#B\n');
  });

  it('returns empty string for empty array', () => {
    expect(joinLines([])).toBe('');
  });
});
