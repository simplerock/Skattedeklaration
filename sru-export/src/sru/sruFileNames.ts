/**
 * SRU filename guard.
 *
 * Skatteverket requires EXACTLY these filenames inside the submission:
 *   INFO.SRU
 *   BLANKETTER.SRU
 *
 * This module is the SINGLE SOURCE OF TRUTH for filenames.
 * No other module should hardcode these strings.
 */

export const SRU_FILE_NAMES = {
  INFO: 'INFO.SRU',
  BLANKETTER: 'BLANKETTER.SRU',
} as const;

export type SruFileName = (typeof SRU_FILE_NAMES)[keyof typeof SRU_FILE_NAMES];

/** All valid SRU filenames as a set for fast lookups */
const VALID_NAMES = new Set<string>(Object.values(SRU_FILE_NAMES));

/**
 * Guard: asserts that a filename is a valid SRU filename.
 * Call this before writing any file to prevent accidental renames.
 *
 * @throws Error if the name is not exactly INFO.SRU or BLANKETTER.SRU
 */
export function assertValidSruFileName(name: string): asserts name is SruFileName {
  if (!VALID_NAMES.has(name)) {
    throw new Error(
      `Invalid SRU filename: "${name}". ` +
      `Must be exactly one of: ${[...VALID_NAMES].join(', ')}. ` +
      `This is a Skatteverket requirement — do not rename SRU files.`
    );
  }
}

/**
 * Safe wrapper: returns the filename only if valid.
 */
export function getSruFileName(type: 'INFO' | 'BLANKETTER'): SruFileName {
  const name = SRU_FILE_NAMES[type];
  assertValidSruFileName(name);
  return name;
}
