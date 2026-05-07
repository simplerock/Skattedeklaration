/**
 * SRU file format constants.
 *
 * Reference: Skatteverket SKV 269 "Teknisk beskrivning för SRU-filer"
 * https://www.skatteverket.se/foretag/etjansterochblanketter/srufilertillskatteverket
 *
 * IMPORTANT: If any constant here is uncertain, mark it with a
 * "// VERIFY:" comment. Do not bury guesses.
 */

/**
 * Line ending in SRU files.
 * SKV 269 section 9.3: "I fortsättningen skrivs endast <LF>"
 */
export const SRU_LINE_ENDING = '\n';

/** Character encoding. SRU files use ISO 8859-1 (Latin-1). */
export const SRU_ENCODING = 'latin1';

/**
 * #PRODUKT value. Must be exactly "SRU" — no year suffix.
 * (Confirmed: Skatteverket accepts "SRU". Old spec shows "SRU2012" but
 * current system accepts bare "SRU".)
 */
export const SRU_PRODUKT = 'SRU';

/**
 * Software identification written in INFO.SRU #PROGRAM line.
 */
export const PROGRAM_NAME = 'Deklarationsformularet';
export const PROGRAM_VERSION = '1.0';

/**
 * Blankett type tokens used in #BLANKETT lines.
 *
 * Per SKV 269 spec (section 9.4.2 + section 4), blankett-block names follow the
 * pattern: <BlankettTyp>-<InkomstÅr>
 * Examples from spec: K10-2012, K5-2012, NE-2012, INK2S-2012
 *
 * For inkomstår 2025: INK1S-2025, K4-2025, K5-2025, K10-2025, NE-2025
 *
 * NOTE: #PERIOD belongs in INFO.SRU, NOT inside blankett blocks in BLANKETTER.SRU.
 * NOTE: INK1 via SRU may require deklarationsombud authorization.
 *
 * VERIFY: INK1S vs INK1 — spec shows INK2S/INK2R variants but no INK1 in
 * SKV 269. INK1 may have its own separate spec. Test INK1S-2025 first.
 */
/**
 * CONFIRMED via Skatteverket's official 2025P4 spec (Filexempel.xlsx from
 * _Nyheter_from_beskattningsperiod_2025P4.zip).
 *
 * Format: <BlankettTyp>-<InkomstÅr>P<Periodnummer>
 * Example from official file: INK1-2025P4, K4-2025P4, NE-2025P4
 *
 * P4 = period 4 (annual, Q4 cutoff, full income year)
 * No S/R variant suffix for INK1 — confirmed by official example.
 */
export const BLANKETT_PERIOD_TOKENS: Record<string, string> = {
  INK1: 'INK1-2025P4',
  K4: 'K4-2025P4',
  K5: 'K5-2025P4',
  K10: 'K10-2025P4',
  NE: 'NE-2025P4',
};

/**
 * Get the blankett type code for a form type.
 * Throws if the form type is unknown.
 */
export function getBlankettPeriodToken(formType: string): string {
  const token = BLANKETT_PERIOD_TOKENS[formType];
  if (!token) {
    throw new Error(`Okänd blanketttyp: ${formType} — blankett-kod saknas`);
  }
  return token;
}
