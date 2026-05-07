import type { SupportedFormType } from '../domain/fieldTypes';
import { ink1Mapping } from './ink1.mapping';
import { k4Mapping } from './k4.mapping';
import { k10Mapping } from './k10.mapping';
import { neMapping } from './ne.mapping';

/**
 * A form mapping defines how a domain form type maps to SRU output.
 *
 * To add a new form:
 * 1. Create <formType>.mapping.ts with a FormMapping export
 * 2. Import and register it in FORM_REGISTRY below
 * 3. Add the schema in schemas/forms/
 * 4. Add tests
 */
export interface FormMapping {
  /** Which domain form type this maps */
  readonly formType: SupportedFormType;
  /** The SRU blankett code (used in #BLANKETT line) */
  readonly blankettCode: string;
  /** Field codes that should be present (advisory) */
  readonly requiredFields: readonly string[];
  /** If set, only these field codes are emitted. Others are silently dropped. */
  readonly allowedFieldCodes?: readonly string[];
  /** Human-readable labels for UI/debugging */
  readonly fieldLabels?: Record<string, string>;
}

/**
 * The central form registry.
 * Every supported form must be registered here.
 */
const FORM_REGISTRY: ReadonlyMap<SupportedFormType, FormMapping> = new Map([
  ['INK1', ink1Mapping],
  ['K4', k4Mapping],
  ['K10', k10Mapping],
  ['NE', neMapping],
]);

/** Get the mapping for a form type. Returns undefined if not registered. */
export function getFormMapping(
  formType: string
): FormMapping | undefined {
  return FORM_REGISTRY.get(formType as SupportedFormType);
}

/** Check if a form type is registered */
export function isFormTypeRegistered(formType: string): boolean {
  return FORM_REGISTRY.has(formType as SupportedFormType);
}

/** Get all registered form types */
export function getRegisteredFormTypes(): SupportedFormType[] {
  return [...FORM_REGISTRY.keys()];
}
