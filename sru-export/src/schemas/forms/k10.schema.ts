import { z } from 'zod';

/**
 * K10 — Kvalificerade andelar i fåmansföretag (3:12-reglerna).
 *
 * Key field codes:
 *   8020 = Gränsbelopp
 *   8023 = Sparat utdelningsutrymme
 *   8015 = Utdelning
 *   8050 = Kapitalvinst
 *
 * Normally one K10 per company owned.
 */
export const K10FormSchema = z.object({
  formType: z.literal('K10'),
  instanceNumber: z.number().int().min(1),
  fields: z
    .array(
      z.object({
        code: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
      })
    )
    .min(1, 'K10 must have at least one field'),
});
