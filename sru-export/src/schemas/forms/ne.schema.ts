import { z } from 'zod';

/**
 * NE — Näringsverksamhet (enskild firma / sole trader).
 *
 * Key field codes:
 *   R1  = Nettoomsättning
 *   R2  = Övriga rörelseintäkter
 *   R5  = Varuinköp
 *   R6  = Övriga kostnader
 *   R11 = Bokfört resultat
 *   R14 = Resultat före avskrivningar
 *
 * One NE per business.
 */
export const NeFormSchema = z.object({
  formType: z.literal('NE'),
  instanceNumber: z.number().int().min(1),
  fields: z
    .array(
      z.object({
        code: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
      })
    )
    .min(1, 'NE must have at least one field'),
});
