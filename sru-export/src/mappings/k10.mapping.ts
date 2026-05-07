import type { FormMapping } from './formRegistry';

/**
 * K10 field mapping — Kvalificerade andelar i fåmansföretag (3:12).
 *
 * VERIFY: Field codes against Skatteverket K10 specification.
 */
export const k10Mapping: FormMapping = {
  formType: 'K10',
  blankettCode: 'K10',

  requiredFields: [],

  allowedFieldCodes: [
    '8020', // Gränsbelopp
    '8023', // Sparat utdelningsutrymme
    '8015', // Utdelning
    '8030', // Kapitalvinst
    '8040', // Sparat utdelningsutrymme, ingående
    '8050', // Kapitalvinst kvalificerade andelar
  ],

  fieldLabels: {
    '8020': 'Gränsbelopp',
    '8023': 'Sparat utdelningsutrymme',
    '8015': 'Utdelning',
    '8050': 'Kapitalvinst kvalificerade andelar',
  },
};
