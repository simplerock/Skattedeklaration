import type { FormMapping } from './formRegistry';

/**
 * INK1 field mapping — Inkomstdeklaration 1 (privatperson).
 *
 * Field codes from Skatteverket P4 specification for INK1 2025.
 * VERIFY: Confirm these codes against the latest official spec each year.
 *
 * Structure:
 * - 7xxx = Inkomster (tjänst, kapital, näringsverksamhet)
 * - 1xxx = Avdrag och reduktioner
 * - 8xxx = Skatt, avgift, reduktioner
 */
export const ink1Mapping: FormMapping = {
  formType: 'INK1',
  blankettCode: 'INK1',

  requiredFields: [
    // No strictly required fields — INK1 can be submitted with minimal data.
    // Skatteverket pre-fills most values. Fields here are "recommended".
  ],

  allowedFieldCodes: [
    // Tjänsteinkomster
    '7011', // Lön, förmåner m.m.
    '7012', // Kostnadsersättningar
    '7013', // Inkomster som inte är pensionsgrundande
    '7014', // Övriga inkomster
    '7120', // Sjukpenning, sjukersättning, A-kassa
    '7210', // Allmän pension
    '7211', // Tjänstepension
    '7212', // Privat pension
    '7240', // Andra inkomster

    // Tjänst — summor
    '1070', // Summa tjänsteinkomster

    // Avdrag tjänst
    '1010', // Resor till arbetet (pendling)
    '1583', // Pendlingsavdrag i km
    '1040', // Dubbel bosättning
    '1050', // Övriga kostnader
    '1060', // Allmänna avdrag

    // Kapital
    '7510', // Överskott av kapital
    '7520', // Underskott av kapital

    // Fastighet
    '7410', // Överskott av bostadsrätt
    '7420', // Underskott av bostadsrätt

    // Näringsverksamhet
    '7610', // Överskott av aktiv näringsverksamhet
    '7620', // Underskott av aktiv näringsverksamhet
    '7630', // Överskott av passiv näringsverksamhet

    // Skattereduktioner
    '1170', // Skattereduktion — ROT/RUT
    '1180', // Skattereduktion — förnybar el

    // Slutskatt
    '8000', // Beräknad skatt
  ],

  fieldLabels: {
    '7011': 'Lön, förmåner m.m.',
    '7120': 'Sjukpenning, A-kassa',
    '7210': 'Allmän pension',
    '7211': 'Tjänstepension',
    '1070': 'Summa tjänsteinkomster',
    '1010': 'Resor till arbetet',
    '1583': 'Pendlingsavdrag (km)',
    '7510': 'Överskott av kapital',
    '7520': 'Underskott av kapital',
    '1170': 'Skattereduktion ROT/RUT',
  },
};
