import { DeclarationSchema } from '../schemas/declaration.schema';
import type { ExportError } from '../domain/declaration';
import { ErrorCodes, createError } from './validationErrors';
import type { ZodError } from 'zod';

/**
 * Schema-level validation: parses raw input against the Zod schema.
 * Returns structured errors if the input doesn't match.
 */
export function validateDeclarationSchema(
  input: unknown
): { success: true; data: ReturnType<typeof DeclarationSchema.parse> } | { success: false; errors: ExportError[] } {
  const result = DeclarationSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: zodErrorsToExportErrors(result.error),
  };
}

function zodErrorsToExportErrors(zodError: ZodError): ExportError[] {
  return zodError.issues.map((issue) => {
    const field = issue.path.join('.');
    return createError(
      ErrorCodes.SCHEMA_VALIDATION_FAILED,
      issue.message,
      field || undefined
    );
  });
}
