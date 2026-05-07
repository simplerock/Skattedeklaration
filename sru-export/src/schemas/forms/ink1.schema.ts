import { z } from 'zod';

/**
 * INK1-specific field validation.
 *
 * INK1 is the main income declaration for individuals.
 * Key field codes (from Skatteverket P4 spec 2025):
 *   7011 = Lön, förmåner
 *   7120 = Sjukpenning etc.
 *   7210 = Pension
 *   1070 = Total tjänsteinkomst (sum field)
 *   1170 = Skattereduktion pendling
 *   1583 = Pendlingsavdrag (km-baserat)
 *
 * This schema validates the INK1-specific constraints.
 * Field codes themselves are validated in the mapping layer.
 */
export const Ink1FormSchema = z.object({
  formType: z.literal('INK1'),
  instanceNumber: z.literal(1, {
    errorMap: () => ({ message: 'INK1 must have instanceNumber 1 — only one INK1 per declaration' }),
  }),
  fields: z
    .array(
      z.object({
        code: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
      })
    )
    .min(1, 'INK1 must have at least one field'),
});
