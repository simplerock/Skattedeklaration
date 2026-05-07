/**
 * Taxpayer identity — the person or entity filing the declaration.
 *
 * personnummer: 12-digit format YYYYMMDDNNNN (no dash in SRU output)
 * organisationsnummer: 10-digit NNNNNNNNNN (used for companies)
 *
 * Exactly one of these must be provided.
 */
export interface Taxpayer {
  /** Swedish personal identity number, 12 digits: YYYYMMDDNNNN */
  readonly personalIdentityNumber?: string;
  /** Swedish organisation number, 10 digits: NNNNNNNNNN */
  readonly organisationNumber?: string;
  /** Legal first name(s) */
  readonly firstName: string;
  /** Legal surname */
  readonly lastName: string;
  /** Postal address — included in INFO.SRU */
  readonly postalAddress?: string;
  /** Postal code — 5 digits */
  readonly postalCode?: string;
  /** City */
  readonly city?: string;
  /** Email for confirmation (not sent in SRU, used in UI) */
  readonly email?: string;
}

/**
 * Returns the identity number to use in SRU files.
 * Strips dashes/spaces. Returns personnummer if available, else organisationsnummer.
 */
export function getIdentityNumber(taxpayer: Taxpayer): string | undefined {
  const raw = taxpayer.personalIdentityNumber ?? taxpayer.organisationNumber;
  if (!raw) return undefined;
  return raw.replace(/[\s\-]/g, '');
}
