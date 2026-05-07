import type {
  Declaration,
  SruExportResult,
  ExportError,
  ExportWarning,
} from '../domain/declaration';
import { validateDeclarationSchema } from '../validation/validateDeclaration';
import { validateForms } from '../validation/validateForms';
import { validateCrossChecks } from '../validation/validateCrossChecks';
import { buildInfoSru } from '../sru/infoSruBuilder';
import { buildBlanketterSruWithDate } from '../sru/blanketterSruBuilder';
import { serializeSruFile } from '../sru/sruSerializer';
import { getSruFileName } from '../sru/sruFileNames';
import { ErrorCodes, createError } from '../validation/validationErrors';

/**
 * Main application entry point for SRU generation.
 *
 * Pipeline:
 * 1. Schema validation (Zod)
 * 2. Business validation (forms, required fields)
 * 3. Cross-form checks
 * 4. Generate INFO.SRU
 * 5. Generate BLANKETTER.SRU
 * 6. Filename guard + empty-content guard
 * 7. Return result
 *
 * If any validation step fails, returns { success: false } with errors.
 * Does not throw — all errors are captured in the result.
 *
 * @param input - Raw declaration data (will be validated)
 * @param filingDate - Optional override for deterministic tests (YYYYMMDD)
 */
export function generateSruPackage(
  input: unknown,
  filingDate?: string
): SruExportResult {
  const allErrors: ExportError[] = [];
  const allWarnings: ExportWarning[] = [];

  // ── Step 1: Schema validation ──
  const schemaResult = validateDeclarationSchema(input);
  if (!schemaResult.success) {
    return {
      success: false,
      files: [],
      warnings: [],
      errors: schemaResult.errors,
    };
  }

  const declaration: Declaration = schemaResult.data;

  // ── Step 2: Business validation ──
  const formValidation = validateForms(declaration);
  allErrors.push(...formValidation.errors);
  allWarnings.push(...formValidation.warnings);

  // ── Step 3: Cross-form checks ──
  const crossCheckErrors = validateCrossChecks(declaration);
  allErrors.push(...crossCheckErrors);

  // Stop if any errors found
  if (allErrors.length > 0) {
    return {
      success: false,
      files: [],
      warnings: allWarnings,
      errors: allErrors,
    };
  }

  // ── Step 4 & 5: Generate SRU files ──
  try {
    const now = new Date();
    const date = filingDate ?? formatTodayYYYYMMDD(now);
    const time = formatNowHHMMSS(now);

    const infoContent = buildInfoSru(declaration);
    const blanketterContent = buildBlanketterSruWithDate(
      declaration,
      date,
      time
    );

    // ── Step 6: Guards ──
    if (!infoContent || infoContent.trim().length === 0) {
      allErrors.push(
        createError(
          ErrorCodes.EMPTY_SRU_OUTPUT,
          'Generated INFO.SRU is empty',
          'INFO.SRU'
        )
      );
    }
    if (!blanketterContent || blanketterContent.trim().length === 0) {
      allErrors.push(
        createError(
          ErrorCodes.EMPTY_SRU_OUTPUT,
          'Generated BLANKETTER.SRU is empty',
          'BLANKETTER.SRU'
        )
      );
    }

    if (allErrors.length > 0) {
      return {
        success: false,
        files: [],
        warnings: allWarnings,
        errors: allErrors,
      };
    }

    // Serialize with filename guard
    const infoFile = serializeSruFile(
      getSruFileName('INFO'),
      infoContent
    );
    const blanketterFile = serializeSruFile(
      getSruFileName('BLANKETTER'),
      blanketterContent
    );

    return {
      success: true,
      files: [infoFile, blanketterFile],
      warnings: allWarnings,
      errors: [],
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown generation error';
    return {
      success: false,
      files: [],
      warnings: allWarnings,
      errors: [
        createError(ErrorCodes.EMPTY_SRU_OUTPUT, message, 'generation'),
      ],
    };
  }
}

function formatTodayYYYYMMDD(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return y + m + day;
}

function formatNowHHMMSS(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return h + m + s;
}
