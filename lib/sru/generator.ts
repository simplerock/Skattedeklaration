import type { DeclarationRecord } from '../types/declaration';

const LF = '\n';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function sruDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
}

function sruTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Returnerar { infoSru, blankettSru } som strängar (LF, ISO 8859-1-kompatibel)
export function generateSruFiles(rec: DeclarationRecord): { infoSru: string; blankettSru: string } {
  const pnr   = rec.personal_identity_number.replace(/\D/g, '');
  const namn  = `${rec.last_name}, ${rec.first_name}`;
  const date  = sruDate();
  const time  = sruTime();
  const year  = rec.income_year;

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
    `#POSTNR 00000`,   // ersätt med riktigt postnr om det lagras
    `#POSTORT Okand`,
    `#KONTAKT ${rec.first_name} ${rec.last_name}`,
    '#MEDIELEV_SLUT',
  ];
  const infoSru = infoLines.join(LF) + LF;

  // ---- BLANKETTER.SRU ----
  const token = `INK1-${year}P4`;
  const lines: string[] = [
    `#BLANKETT ${token}`,
    `#IDENTITET ${pnr} ${date} ${time}`,
    `#NAMN ${namn}`,
  ];

  const add = (kod: number, val: number) => {
    if (val > 0) lines.push(`#UPPGIFT ${kod} ${val}`);
  };

  add(1000, rec.salary);
  add(1070, rec.travel_deduction);
  add(1073, rec.other_work_expenses);
  add(1583, rec.rot_deduction);
  add(1584, rec.rut_deduction);
  add(1101, rec.rental_net);
  add(1102, rec.capital_gain_funds);
  add(1170, rec.interest_secured);
  add(1177, rec.interest_unsecured);
  add(1172, rec.capital_loss_funds);

  // K5 — bostadsförsäljning
  if (rec.housing_sale_price && rec.housing_buy_price) {
    const sp  = rec.housing_sale_price;
    const bp  = rec.housing_buy_price;
    const imp = rec.housing_improvements ?? 0;
    const sc  = rec.housing_sale_costs   ?? 0;
    const res = sp - bp - imp - sc;

    lines.push('#BLANKETTSLUT');
    lines.push(`#BLANKETT K5-${year}P4`);
    lines.push(`#IDENTITET ${pnr} ${date} ${time}`);
    lines.push(`#NAMN ${namn}`);
    lines.push(`#UPPGIFT 3620 ${sp}`);
    lines.push(`#UPPGIFT 3621 ${sc}`);
    lines.push(`#UPPGIFT 3622 ${bp}`);
    if (imp > 0) lines.push(`#UPPGIFT 3623 ${imp}`);
    lines.push(`#UPPGIFT 3625 ${res}`);
    if (res > 0) lines.push(`#UPPGIFT 3629 ${res}`);
    else         lines.push(`#UPPGIFT 3630 ${Math.abs(res)}`);
  }

  lines.push('#BLANKETTSLUT');
  lines.push('#FIL_SLUT');

  const blankettSru = lines.join(LF) + LF;
  return { infoSru, blankettSru };
}
