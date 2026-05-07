import { z } from 'zod';

/**
 * K4 — Kapitalvinst/förlust vid försäljning av aktier, fonder etc.
 *
 * Key field codes:
 *   3100 = Antal (number of shares/units)
 *   3101 = Beteckning (name of asset)
 *   3103 = Försäljningspris
 *   3104 = Omkostnadsbelopp
 *   3105 = Vinst
 *   3106 = Förlust
 *
 * Multiple K4 instances allowed (one per transaction row in section A/B/C/D).
 */
export const K4FormSchema = z.object({
  formType: z.literal('K4'),
  instanceNumber: z.number().int().min(1),
  fields: z
    .array(
      z.object({
        code: z.string(),
        value: z.union([z.number(), z.string(), z.boolean()]),
      })
    )
    .min(1, 'K4 must have at least one field'),
});
