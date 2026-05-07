import type { FormMapping } from './formRegistry';

/**
 * K4 field mapping — Försäljning av värdepapper m.m.
 *
 * VERIFY: Field codes against Skatteverket K4 specification.
 */
export const k4Mapping: FormMapping = {
  formType: 'K4',
  blankettCode: 'K4',

  requiredFields: [],

  allowedFieldCodes: [
    // Avsnitt A — marknadsnoterade aktier
    '3100', // Antal/beteckning
    '3101', // Beteckning
    '3103', // Försäljningspris
    '3104', // Omkostnadsbelopp
    '3105', // Vinst
    '3106', // Förlust

    // Avsnitt D — övriga värdepapper
    '3300', // Beteckning
    '3303', // Försäljningspris
    '3304', // Omkostnadsbelopp
    '3305', // Vinst
    '3306', // Förlust

    // Summeringar
    '3410', // Summa vinst avsnitt A
    '3411', // Summa förlust avsnitt A
  ],

  fieldLabels: {
    '3100': 'Antal',
    '3101': 'Beteckning',
    '3103': 'Försäljningspris',
    '3104': 'Omkostnadsbelopp',
    '3105': 'Vinst',
    '3106': 'Förlust',
  },
};
