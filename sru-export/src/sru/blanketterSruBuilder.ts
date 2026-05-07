import type { Declaration } from '../domain/declaration';
import type { DeclarationForm } from '../domain/forms';
import { getIdentityNumber } from '../domain/taxpayer';
import { getBlankettPeriodToken, SRU_LINE_ENDING } from './constants';
import {
  blankettLine,
  identitetLine,
  namnLine,
  uppgiftLine,
  joinLines,
} from './lineBuilder';
import { getFormMapping } from '../mappings/formRegistry';

/**
 * Build the content of BLANKETTER.SRU.
 *
 * Structure per SKV 269:
 *
 * For each form:
 *   #BLANKETT <periodtoken>       e.g. INK1S-2025P4
 *   #IDENTITET <pnr12> <date> <time>
 *   #NAMN <surname>, <firstname>
 *   #UPPGIFT <code> <value>
 *   ... (one line per field)
 *   #BLANKETTSLUT
 *
 * After all forms:
 *   #FIL_SLUT
 *
 * Ordering:
 * - INK1 first, then supplementary forms in stable order
 * - Fields within a form sorted by code (ascending) for determinism
 */
export function buildBlanketterSru(declaration: Declaration): string {
  const now = new Date();
  const filingDate = formatDateYYYYMMDD(now);
  const filingTime = formatTimeHHMMSS(now);
  return buildBlanketterSruWithDate(declaration, filingDate, filingTime);
}

/**
 * Overload for deterministic testing: accept explicit filing date and time.
 */
export function buildBlanketterSruWithDate(
  declaration: Declaration,
  filingDate: string,
  filingTime: string = '120000'
): string {
  const { taxpayer } = declaration;
  const identityNumber = getIdentityNumber(taxpayer);

  if (!identityNumber) {
    throw new Error('Cannot build BLANKETTER.SRU: no identity number');
  }

  const fullName = { lastName: taxpayer.lastName, firstName: taxpayer.firstName };

  // Sort forms: INK1 first, then alphabetically by type, then by instance number
  const sortedForms = [...declaration.forms].sort((a, b) => {
    if (a.formType === 'INK1' && b.formType !== 'INK1') return -1;
    if (b.formType === 'INK1' && a.formType !== 'INK1') return 1;
    const typeCompare = a.formType.localeCompare(b.formType);
    if (typeCompare !== 0) return typeCompare;
    return a.instanceNumber - b.instanceNumber;
  });

  const allLines: string[] = [];

  for (const form of sortedForms) {
    allLines.push(
      ...buildSingleBlankett(form, identityNumber, filingDate, filingTime, fullName)
    );
  }

  // End of file
  allLines.push('#FIL_SLUT' + SRU_LINE_ENDING);

  return joinLines(allLines);
}

/**
 * Build lines for a single blankett (form instance).
 */
function buildSingleBlankett(
  form: DeclarationForm,
  identityNumber: string,
  filingDate: string,
  filingTime: string,
  name: { lastName: string; firstName: string }
): string[] {
  const lines: string[] = [];

  // Use period token instead of bare type code
  const periodToken = getBlankettPeriodToken(form.formType);

  // Header
  // NOTE: #PERIOD belongs in INFO.SRU, not here. Per SKV 269 spec section 9.4.2,
  // blankett blocks do NOT contain #PERIOD.
  lines.push(blankettLine(periodToken));
  lines.push(identitetLine(identityNumber, filingDate, filingTime));
  lines.push(namnLine(name.lastName, name.firstName));

  // Get mapping for field ordering/filtering
  const mapping = getFormMapping(form.formType);

  // Sort fields by code for deterministic output
  const sortedFields = [...form.fields].sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true })
  );

  for (const field of sortedFields) {
    // Skip fields with empty/null values
    if (field.value === '' || field.value === null || field.value === undefined) {
      continue;
    }

    // If mapping has a whitelist, only emit whitelisted codes
    if (mapping?.allowedFieldCodes) {
      if (!mapping.allowedFieldCodes.includes(field.code)) {
        continue;
      }
    }

    lines.push(uppgiftLine(field.code, field.value));
  }

  // Footer
  lines.push('#BLANKETTSLUT' + SRU_LINE_ENDING);

  return lines;
}

/** Format a Date to YYYYMMDD string */
function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return y + m + d;
}

/** Format a Date to HHMMSS string */
function formatTimeHHMMSS(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return h + m + s;
}
