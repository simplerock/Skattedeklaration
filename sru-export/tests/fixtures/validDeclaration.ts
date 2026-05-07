/**
 * Shared test fixtures for valid declarations.
 */
import type { Declaration } from '../../src/domain/declaration';

/** Minimal valid INK1-only declaration */
export function makeMinimalDeclaration(
  overrides?: Partial<Declaration>
): Declaration {
  return {
    taxpayer: {
      personalIdentityNumber: '199001011234',
      firstName: 'Anna',
      lastName: 'Svensson',
      postalCode: '11122',  // POSTNR är obligatoriskt i INFO.SRU
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [
          { code: '7011', value: 450000 },
          { code: '1070', value: 450000 },
        ],
      },
    ],
    ...overrides,
  };
}

/** Declaration with INK1 + K4 */
export function makeInk1K4Declaration(): Declaration {
  return {
    taxpayer: {
      personalIdentityNumber: '198505152345',
      firstName: 'Erik',
      lastName: 'Johansson',
      postalAddress: 'Storgatan 1',
      postalCode: '11122',
      city: 'Stockholm',
      email: 'erik@example.com',
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [
          { code: '7011', value: 550000 },
          { code: '1070', value: 550000 },
          { code: '7510', value: 35000 },
        ],
      },
      {
        formType: 'K4',
        instanceNumber: 1,
        fields: [
          { code: '3100', value: '100' },
          { code: '3101', value: 'Volvo B' },
          { code: '3103', value: 50000 },
          { code: '3104', value: 15000 },
          { code: '3105', value: 35000 },
        ],
      },
    ],
  };
}

/** Declaration with INK1 + K10 */
export function makeInk1K10Declaration(): Declaration {
  return {
    taxpayer: {
      personalIdentityNumber: '197003103456',
      firstName: 'Maria',
      lastName: 'Andersson',
      postalCode: '41256',
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [
          { code: '7011', value: 600000 },
          { code: '1070', value: 600000 },
          { code: '7510', value: 200000 },
        ],
      },
      {
        formType: 'K10',
        instanceNumber: 1,
        fields: [
          { code: '8020', value: 180000 },
          { code: '8023', value: 150000 },
          { code: '8015', value: 200000 },
        ],
      },
    ],
  };
}

/** Declaration with INK1 + NE */
export function makeInk1NeDeclaration(): Declaration {
  return {
    taxpayer: {
      personalIdentityNumber: '196512124567',
      firstName: 'Lars',
      lastName: 'Nilsson',
      postalCode: '22100',
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [
          { code: '7610', value: 120000 },
          { code: '1070', value: 120000 },
        ],
      },
      {
        formType: 'NE',
        instanceNumber: 1,
        fields: [
          { code: '5010', value: 300000 },
          { code: '5050', value: 80000 },
          { code: '5060', value: 100000 },
          { code: '5110', value: 120000 },
          { code: '5140', value: 120000 },
        ],
      },
    ],
  };
}

/** Raw input object (unknown type) for schema validation testing */
export function makeRawValidInput(): unknown {
  return {
    taxpayer: {
      personalIdentityNumber: '199001011234',
      firstName: 'Anna',
      lastName: 'Svensson',
    },
    incomeTaxYear: 2025,
    forms: [
      {
        formType: 'INK1',
        instanceNumber: 1,
        fields: [{ code: '7011', value: 450000 }],
      },
    ],
  };
}
