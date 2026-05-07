import type { Taxpayer } from './taxpayer';
import type { DeclarationForm } from './forms';

/**
 * The full declaration — everything needed to generate SRU files.
 *
 * incomeTaxYear: the year the income was earned (e.g. 2025)
 * This is NOT the filing year (which would be 2026).
 */
export interface Declaration {
  /** The taxpayer identity */
  readonly taxpayer: Taxpayer;
  /** Income year, e.g. 2025 */
  readonly incomeTaxYear: number;
  /**
   * All forms included in this declaration.
   * Must include exactly one INK1. May include K4, K10, NE etc.
   */
  readonly forms: readonly DeclarationForm[];
}

/**
 * The result of the SRU generation pipeline.
 */
export interface SruExportResult {
  readonly success: boolean;
  readonly files: readonly SruFile[];
  readonly warnings: readonly ExportWarning[];
  readonly errors: readonly ExportError[];
}

export interface SruFile {
  /** Must be exactly "INFO.SRU" or "BLANKETTER.SRU" */
  readonly name: 'INFO.SRU' | 'BLANKETTER.SRU';
  /** File content encoded as a string (ISO 8859-1 compatible) */
  readonly content: string;
}

export interface ExportError {
  readonly code: string;
  readonly field?: string;
  readonly message: string;
  readonly severity: 'error';
}

export interface ExportWarning {
  readonly code: string;
  readonly field?: string;
  readonly message: string;
  readonly severity: 'warning';
}
