import type { FormMapping } from './formRegistry';

/**
 * NE field mapping — Näringsverksamhet (enskild firma).
 *
 * VERIFY: Field codes against Skatteverket NE specification.
 * NE field codes often use "R" prefix (R1, R2, etc.) internally
 * but are mapped to numeric SRU codes.
 */
export const neMapping: FormMapping = {
  formType: 'NE',
  blankettCode: 'NE',

  requiredFields: [],

  allowedFieldCodes: [
    '5010', // Nettoomsättning (R1)
    '5020', // Övriga rörelseintäkter (R2)
    '5050', // Varuinköp (R5)
    '5060', // Övriga rörelsekostnader (R6)
    '5110', // Bokfört resultat (R11)
    '5140', // Skattemässigt resultat (R14)
    '5410', // Egenavgifter
    '5420', // Sjukpenning
  ],

  fieldLabels: {
    '5010': 'Nettoomsättning',
    '5020': 'Övriga rörelseintäkter',
    '5050': 'Varuinköp',
    '5060': 'Övriga rörelsekostnader',
    '5110': 'Bokfört resultat',
    '5140': 'Skattemässigt resultat',
  },
};
