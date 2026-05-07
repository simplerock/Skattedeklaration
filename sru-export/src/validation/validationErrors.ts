import type { ExportError, ExportWarning } from '../domain/declaration';

/**
 * Error codes used across the validation layer.
 * Centralized here so tests and UI can reference them by constant.
 */
export const ErrorCodes = {
  // Schema
  SCHEMA_VALIDATION_FAILED: 'SCHEMA_VALIDATION_FAILED',

  // Taxpayer
  MISSING_IDENTITY_NUMBER: 'MISSING_IDENTITY_NUMBER',
  INVALID_PERSONNUMMER: 'INVALID_PERSONNUMMER',
  INVALID_ORGNUMMER: 'INVALID_ORGNUMMER',
  MISSING_NAME: 'MISSING_NAME',

  // Declaration
  MISSING_INCOME_TAX_YEAR: 'MISSING_INCOME_TAX_YEAR',
  MISSING_FORMS: 'MISSING_FORMS',
  MISSING_INK1: 'MISSING_INK1',
  MULTIPLE_INK1: 'MULTIPLE_INK1',

  // Forms
  UNSUPPORTED_FORM_TYPE: 'UNSUPPORTED_FORM_TYPE',
  MISSING_FORM_MAPPING: 'MISSING_FORM_MAPPING',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'INVALID_FIELD_VALUE',
  EMPTY_FORM_FIELDS: 'EMPTY_FORM_FIELDS',

  // Cross-checks
  CROSS_CHECK_MISMATCH: 'CROSS_CHECK_MISMATCH',

  // SRU generation
  EMPTY_SRU_OUTPUT: 'EMPTY_SRU_OUTPUT',
  INVALID_SRU_FILENAME: 'INVALID_SRU_FILENAME',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** Factory: create a structured error */
export function createError(
  code: ErrorCode,
  message: string,
  field?: string
): ExportError {
  return { code, field, message, severity: 'error' };
}

/** Factory: create a structured warning */
export function createWarning(
  code: string,
  message: string,
  field?: string
): ExportWarning {
  return { code, field, message, severity: 'warning' };
}
