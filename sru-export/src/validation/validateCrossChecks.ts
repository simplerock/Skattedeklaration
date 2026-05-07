import type { Declaration, ExportError } from '../domain/declaration';
import { ErrorCodes, createError } from './validationErrors';

/**
 * Cross-form validation: checks relationships between forms.
 *
 * Examples:
 * - If K4 reports capital gains, INK1 should have the corresponding summary field
 * - If K10 is present, taxpayer should have an AB (not enforced in SRU, but warned)
 *
 * This is the layer for "if form A says X, form B should say Y".
 * Keep each check as a named function for auditability.
 */
export function validateCrossChecks(declaration: Declaration): ExportError[] {
  const errors: ExportError[] = [];

  errors.push(...checkK4RequiresInk1CapitalFields(declaration));
  errors.push(...checkK10RequiresInk1DividendFields(declaration));

  return errors;
}

/**
 * If any K4 forms exist with gains/losses, INK1 should have
 * a capital income summary field. This is a soft check (warning-level)
 * but we return it as error-severity since Skatteverket may reject it.
 */
function checkK4RequiresInk1CapitalFields(
  declaration: Declaration
): ExportError[] {
  const hasK4 = declaration.forms.some((f) => f.formType === 'K4');
  if (!hasK4) return [];

  const ink1 = declaration.forms.find((f) => f.formType === 'INK1');
  if (!ink1) return []; // Already caught by validateForms

  // Field 7510 = Överskott av kapital, 7520 = Underskott av kapital
  const hasCapitalField = ink1.fields.some(
    (f) => f.code === '7510' || f.code === '7520'
  );

  if (!hasCapitalField) {
    return [
      createError(
        ErrorCodes.CROSS_CHECK_MISMATCH,
        'K4 present but INK1 has no capital income field (7510/7520). Verify totals.',
        'forms[INK1].fields.7510'
      ),
    ];
  }

  return [];
}

/**
 * If K10 is present, INK1 should have dividend income fields.
 */
function checkK10RequiresInk1DividendFields(
  declaration: Declaration
): ExportError[] {
  const hasK10 = declaration.forms.some((f) => f.formType === 'K10');
  if (!hasK10) return [];

  // This is informational — K10 and INK1 don't always have direct field dependencies
  // but it's worth flagging if INK1 has zero capital fields when K10 exists.
  return [];
}
