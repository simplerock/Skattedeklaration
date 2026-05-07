/**
 * Field types used in SRU form fields.
 *
 * KU = kontrolluppgift field codes (4-digit numeric)
 * SRU values are always strings in the file — integers represented without decimals,
 * monetary amounts in whole SEK (öre not used in INK1/K4/K10/NE).
 */

/** A 4-digit SRU field code like "7011", "7120", etc. */
export type SruFieldCode = string;

/** Possible value types for a form field */
export type FieldValue = number | string | boolean;

/** A single field entry: code → value */
export interface FormField {
  /** SRU field code, e.g. "7011" */
  readonly code: SruFieldCode;
  /** The value to write. Numbers are formatted as integers. Booleans become "1"/"0". */
  readonly value: FieldValue;
}

/** Supported form types — extend this union as new forms are added */
export type SupportedFormType = 'INK1' | 'K4' | 'K10' | 'NE';

/**
 * All form types Skatteverket accepts in SRU.
 * This is the exhaustive list we support. Adding a new form means:
 * 1. Add to this union
 * 2. Add a schema in schemas/forms/
 * 3. Add a mapping in mappings/
 * 4. Register in formRegistry
 */
export const SUPPORTED_FORM_TYPES: readonly SupportedFormType[] = [
  'INK1',
  'K4',
  'K10',
  'NE',
] as const;
