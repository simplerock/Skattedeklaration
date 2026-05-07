import type { Declaration, ExportError, ExportWarning } from '../domain/declaration';
import { ErrorCodes, createError, createWarning } from './validationErrors';
import { SUPPORTED_FORM_TYPES } from '../domain/fieldTypes';
import { getFormMapping } from '../mappings/formRegistry';

/**
 * Business-level form validation.
 * Runs AFTER schema validation passes.
 *
 * Checks:
 * - Exactly one INK1 is present
 * - All form types are supported
 * - All form types have mappings registered
 * - No forms have empty field arrays
 * - Required fields per form type are present
 */
export function validateForms(declaration: Declaration): {
  errors: ExportError[];
  warnings: ExportWarning[];
} {
  const errors: ExportError[] = [];
  const warnings: ExportWarning[] = [];

  const ink1Forms = declaration.forms.filter((f) => f.formType === 'INK1');

  // Exactly one INK1 required
  if (ink1Forms.length === 0) {
    errors.push(
      createError(
        ErrorCodes.MISSING_INK1,
        'Declaration must include exactly one INK1 form',
        'forms'
      )
    );
  } else if (ink1Forms.length > 1) {
    errors.push(
      createError(
        ErrorCodes.MULTIPLE_INK1,
        `Found ${ink1Forms.length} INK1 forms — only one is allowed`,
        'forms'
      )
    );
  }

  for (const form of declaration.forms) {
    const formPath = `forms[${form.formType}#${form.instanceNumber}]`;

    // Check form type is in supported list
    if (
      !SUPPORTED_FORM_TYPES.includes(
        form.formType as (typeof SUPPORTED_FORM_TYPES)[number]
      )
    ) {
      errors.push(
        createError(
          ErrorCodes.UNSUPPORTED_FORM_TYPE,
          `Form type "${form.formType}" is not supported`,
          formPath
        )
      );
      continue;
    }

    // Check mapping exists
    const mapping = getFormMapping(form.formType);
    if (!mapping) {
      errors.push(
        createError(
          ErrorCodes.MISSING_FORM_MAPPING,
          `No mapping registered for form type "${form.formType}"`,
          formPath
        )
      );
      continue;
    }

    // Check fields not empty
    if (form.fields.length === 0) {
      errors.push(
        createError(
          ErrorCodes.EMPTY_FORM_FIELDS,
          `Form ${form.formType}#${form.instanceNumber} has no fields`,
          formPath
        )
      );
    }

    // Check required fields from mapping
    if (mapping.requiredFields) {
      for (const requiredCode of mapping.requiredFields) {
        const hasField = form.fields.some((f) => f.code === requiredCode);
        if (!hasField) {
          warnings.push(
            createWarning(
              ErrorCodes.MISSING_REQUIRED_FIELD,
              `Field ${requiredCode} is recommended for ${form.formType} but missing`,
              `${formPath}.fields.${requiredCode}`
            )
          );
        }
      }
    }
  }

  return { errors, warnings };
}
