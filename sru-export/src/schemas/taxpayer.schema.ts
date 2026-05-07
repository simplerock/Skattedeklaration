import { z } from 'zod';

/**
 * Personnummer: 12 digits YYYYMMDDNNNN
 * We accept with or without dash, but normalize to 12 digits.
 */
const personnummerRegex = /^\d{8}[\-]?\d{4}$/;

/**
 * Organisationsnummer: 10 digits NNNNNNNNNN
 * We accept with or without dash.
 */
const orgnummerRegex = /^\d{6}[\-]?\d{4}$/;

export const TaxpayerSchema = z
  .object({
    personalIdentityNumber: z
      .string()
      .regex(personnummerRegex, 'Personnummer must be 12 digits (YYYYMMDDNNNN)')
      .optional(),
    organisationNumber: z
      .string()
      .regex(orgnummerRegex, 'Organisationsnummer must be 10 digits')
      .optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    postalAddress: z.string().optional(),
    postalCode: z
      .string()
      .regex(/^\d{3}\s?\d{2}$/, 'Postal code must be 5 digits')
      .optional(),
    city: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (data) => data.personalIdentityNumber || data.organisationNumber,
    {
      message:
        'Either personalIdentityNumber or organisationNumber must be provided',
      path: ['personalIdentityNumber'],
    }
  );

export type TaxpayerInput = z.input<typeof TaxpayerSchema>;
