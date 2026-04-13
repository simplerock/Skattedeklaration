// Server-side SRU generator — must stay in sync with public/sru-core.js
import type { DeclarationRecord } from '../types/declaration';

const LF = '\n';

// Blankett period tokens — must match public/sru-core.js BLANKETT_PERIOD_TOKENS
const BLANKETT_PERIOD_TOKENS: Record<string, string> = {
  INK1: 'INK1-2025P4',
  K4:   'K4-2025P4',
  K5:   'K5-2025P4',
  K10:  'K10-2025P4',
  NE:   'NE-2025P4',
};

function sruPnr12(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12) return digits;
  if (digits.length === 10) {
    const yy = parseInt(digits.slice(0, 2), 10);
    const currentYY = new Date().getFullYear() % 100;
    return (yy <= currentYY ? '20' : '19') + digits;
  }
  return digits;
}

function sruNow(): { date: string; time: string } {
  const now = new Date();
  const d = now.toISOString().slice(0, 10).replace(/-/g, '');
  const t = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return { date: d, time: t };
}

function buildBlankett(
  formType: string,
  identity: { pnr: string; namn: string; date: string; time: string },
  fields: [number, number][],
): string[] {
  const token = BLANKETT_PERIOD_TOKENS[formType];
  if (!token) throw new Error(`Unknown blankett type: ${formType}`);
  const lines: string[] = [
    `#BLANKETT ${token}`,
    `#IDENTITET ${identity.pnr} ${identity.date} ${identity.time}`,
  ];
  if (identity.namn) lines.push(`#NAMN ${identity.namn}`);
  for (const [code, val] of fields) {
    if (val !== 0 && val != null) {
      lines.push(`#UPPGIFT ${code} ${Math.round(val)}`);
    }
  }
  lines.push('#BLANKETTSLUT');
  return lines;
}

export function generateSruFiles(rec: DeclarationRecord): { infoSru: string; blankettSru: string } {
  const pnr = sruPnr12(rec.personal_identity_number);
  const namn = `${rec.last_name}, ${rec.first_name}`;
  const { date, time } = sruNow();

  // ---- INFO.SRU ----
  const infoLines = [
    '#DATABESKRIVNING_START',
    '#PRODUKT SRU',
    `#SKAPAD ${date}`,
    '#PROGRAM Skattedeklaration 1.0',
    '#FILNAMN BLANKETTER.SRU',
    '#DATABESKRIVNING_SLUT',
    '#MEDIELEV_START',
    `#ORGNR ${pnr}`,
    `#NAMN ${namn}`,
  ];
  if (rec.address) {
    const addr = rec.address.split(',')[0].trim();
    if (addr) infoLines.push(`#ADRESS ${addr}`);
  }
  infoLines.push(`#POSTNR ${rec.postnummer || '00000'}`);
  infoLines.push(`#POSTORT ${rec.postort || 'Okand'}`);
  infoLines.push(`#KONTAKT ${rec.first_name} ${rec.last_name}`);
  infoLines.push('#MEDIELEV_SLUT');
  const infoSru = infoLines.join(LF) + LF;

  // ---- BLANKETTER.SRU ----
  const identity = { pnr, namn, date, time };
  const blankettBlocks: string[][] = [];

  // INK1
  const sp = rec.housing_sale_price ?? 0;
  const bp = rec.housing_buy_price ?? 0;
  const imp = rec.housing_improvements ?? 0;
  const sc = rec.housing_sale_costs ?? 0;
  const housingGain = (sp > 0 && bp > 0) ? Math.max(0, sp - bp - imp - sc) : 0;
  const housingLoss = (sp > 0 && bp > 0) ? Math.max(0, bp + imp + sc - sp) * 0.50 : 0;

  const ink1Fields: [number, number][] = [
    [1000, rec.salary],
    [1070, rec.travel_deduction],
    [1073, rec.other_work_expenses],
    [1583, rec.rot_deduction],
    [1584, rec.rut_deduction],
    [1101, rec.rental_net],
    [1102, rec.capital_gain_funds],
    [1104, housingGain],
    [1170, rec.interest_secured],
    [1177, rec.interest_unsecured],
    [1172, rec.capital_loss_funds],
    [1174, housingLoss],
  ];
  blankettBlocks.push(buildBlankett('INK1', identity, ink1Fields));

  // K5
  if (sp > 0 && bp > 0) {
    const res = sp - bp - imp - sc;
    const k5Fields: [number, number][] = [
      [3620, sp],
      [3621, sc],
      [3622, bp],
      [3623, imp],
      [3625, res],
      [res > 0 ? 3629 : 3630, Math.abs(res)],
    ];
    blankettBlocks.push(buildBlankett('K5', identity, k5Fields));
  }

  const allLines = blankettBlocks.flat();
  allLines.push('#FIL_SLUT');
  const blankettSru = allLines.join(LF) + LF;

  return { infoSru, blankettSru };
}
