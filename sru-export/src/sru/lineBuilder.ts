import { SRU_LINE_ENDING } from './constants';
import type { FieldValue } from '../domain/fieldTypes';

/**
 * Pure functions for building individual SRU lines.
 *
 * SRU lines follow the format: #KEYWORD value1 value2
 * Fields are space-separated.
 * Lines end with LF (per SKV 269 section 9.3).
 */

/** Build a single SRU line from keyword and values */
export function sruLine(keyword: string, ...values: string[]): string {
  if (values.length === 0) {
    return keyword + SRU_LINE_ENDING;
  }
  return keyword + ' ' + values.join(' ') + SRU_LINE_ENDING;
}

/** Format a field value for SRU output */
export function formatFieldValue(value: FieldValue): string {
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    // SRU uses integer values — no decimals for monetary amounts
    return Math.round(value).toString();
  }
  // String values: trim, no line breaks
  return value.toString().trim().replace(/[\r\n]/g, ' ');
}

/** Build an #UPPGIFT line: #UPPGIFT <code> <value> */
export function uppgiftLine(code: string, value: FieldValue): string {
  return sruLine('#UPPGIFT', code, formatFieldValue(value));
}

/** Build an #IDENTITET line: #IDENTITET <personnummer> <date> <time> */
export function identitetLine(
  identityNumber: string,
  filingDate: string,
  filingTime?: string
): string {
  if (filingTime) {
    return sruLine('#IDENTITET', identityNumber, filingDate, filingTime);
  }
  return sruLine('#IDENTITET', identityNumber, filingDate);
}

/** Build a #BLANKETT line: #BLANKETT <formType> */
export function blankettLine(formTypeCode: string): string {
  return sruLine('#BLANKETT', formTypeCode);
}

/** Build a #NAMN line: #NAMN <lastName>, <firstName> */
export function namnLine(lastName: string, firstName: string): string {
  // SRU format: surname first, then given names
  return sruLine('#NAMN', `${lastName}, ${firstName}`);
}

/** Join multiple lines into a single string */
export function joinLines(lines: string[]): string {
  return lines.join('');
}
