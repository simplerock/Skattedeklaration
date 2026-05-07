import { z } from 'zod';
import { TaxpayerSchema } from './taxpayer.schema';
import { SUPPORTED_FORM_TYPES } from '../domain/fieldTypes';

const FormFieldSchema = z.object({
  code: z
    .string()
    .regex(/^\d{3,5}$/, 'SRU field code must be 3-5 digits'),
  value: z.union([z.number(), z.string(), z.boolean()]),
});

const DeclarationFormSchema = z.object({
  formType: z.enum(SUPPORTED_FORM_TYPES as unknown as [string, ...string[]]),
  instanceNumber: z.number().int().min(1),
  fields: z.array(FormFieldSchema),
});

export const DeclarationSchema = z.object({
  taxpayer: TaxpayerSchema,
  incomeTaxYear: z
    .number()
    .int()
    .min(2000, 'Income tax year must be 2000 or later')
    .max(2099, 'Income tax year must be before 2100'),
  forms: z
    .array(DeclarationFormSchema)
    .min(1, 'At least one form is required'),
});

export type DeclarationInput = z.input<typeof DeclarationSchema>;
