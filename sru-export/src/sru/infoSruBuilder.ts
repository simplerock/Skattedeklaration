import type { Declaration } from '../domain/declaration';
import { getIdentityNumber } from '../domain/taxpayer';
import {
  PROGRAM_NAME,
  PROGRAM_VERSION,
  SRU_PRODUKT,
  SRU_LINE_ENDING,
} from './constants';
import { sruLine, joinLines } from './lineBuilder';

/**
 * Build the content of INFO.SRU.
 *
 * Structure per SKV 269:
 *
 *   #DATABESKRIVNING_START
 *   #PRODUKT SRU
 *   #SKAPAD <YYYYMMDDHHMMSS>
 *   #PROGRAM <name> <version>
 *   #FILNAMN BLANKETTER.SRU
 *   #DATABESKRIVNING_SLUT
 *   #MEDIELEV_START
 *   #ORGNR <personnummer/orgnummer 12 digits>
 *   #NAMN <Efternamn, Förnamn>
 *   [#ADRESS <address>]
 *   [#POSTNR <5 digits, never 00000>]
 *   [#POSTORT <city>]
 *   [#KONTAKT <name>]
 *   #MEDIELEV_SLUT
 *
 * NO #PERIOD row. NO #MEDESSION. NO #UPPGIFTSLAMNAREID.
 */
export function buildInfoSru(declaration: Declaration, nowISO?: string): string {
  const { taxpayer } = declaration;
  const identityNumber = getIdentityNumber(taxpayer);

  if (!identityNumber) {
    throw new Error('Cannot build INFO.SRU: no identity number');
  }

  const fullName = `${taxpayer.lastName}, ${taxpayer.firstName}`;
  const skapad = nowISO ?? formatSkapadDate(new Date());

  const lines: string[] = [];

  // -- DATABESKRIVNING block --
  lines.push(sruLine('#DATABESKRIVNING_START'));
  lines.push(sruLine('#PRODUKT', SRU_PRODUKT));
  lines.push(sruLine('#SKAPAD', skapad));
  lines.push(sruLine('#PROGRAM', PROGRAM_NAME, PROGRAM_VERSION));
  lines.push(sruLine('#FILNAMN', 'BLANKETTER.SRU'));
  lines.push(sruLine('#DATABESKRIVNING_SLUT'));

  // -- MEDIELEV block --
  lines.push(sruLine('#MEDIELEV_START'));
  lines.push(sruLine('#ORGNR', identityNumber));
  lines.push(sruLine('#NAMN', fullName));

  // Optional address fields (order matters: ADRESS → POSTNR → POSTORT → KONTAKT)
  if (taxpayer.postalAddress) {
    lines.push(sruLine('#ADRESS', taxpayer.postalAddress));
  }

  // POSTNR is required by Skatteverket. Strip spaces, reject 00000.
  const cleanPostalCode = taxpayer.postalCode?.replace(/\s/g, '');
  if (!cleanPostalCode || cleanPostalCode === '00000') {
    throw new Error('Cannot build INFO.SRU: postalCode is required and must not be 00000');
  }
  lines.push(sruLine('#POSTNR', cleanPostalCode));

  if (taxpayer.city) {
    lines.push(sruLine('#POSTORT', taxpayer.city));
  }

  // Contact person — must come after POSTNR
  lines.push(sruLine('#KONTAKT', fullName));

  lines.push(sruLine('#MEDIELEV_SLUT'));

  return joinLines(lines);
}

/**
 * Format current date as YYYYMMDD for #SKAPAD line.
 * Skatteverket rejects YYYYMMDDHHMMSS (14 digits) — use date only.
 */
function formatSkapadDate(date: Date): string {
  const y = date.getFullYear().toString();
  const mo = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return y + mo + d;
}
