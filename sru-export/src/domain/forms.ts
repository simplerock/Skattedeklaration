import type { SupportedFormType, FormField } from './fieldTypes';

/**
 * A single form instance in a declaration.
 *
 * A declaration always has exactly one INK1.
 * It may have zero or more K4, K10, NE forms (one per entity/transaction).
 *
 * Each form instance carries its own fields — the mapping layer
 * translates these into SRU #UPPGIFT lines.
 */
export interface DeclarationForm {
  /** Which blankett this is */
  readonly formType: SupportedFormType;
  /**
   * Sequence number when multiple instances of the same form exist.
   * E.g. K4 section A row 1 = instance 1, row 2 = instance 2.
   * For INK1 this is always 1.
   */
  readonly instanceNumber: number;
  /** The field values for this form instance */
  readonly fields: readonly FormField[];
}

/**
 * Convenience: extract all fields for a given code from a form.
 */
export function getFieldValue(
  form: DeclarationForm,
  code: string
): FormField | undefined {
  return form.fields.find((f) => f.code === code);
}
