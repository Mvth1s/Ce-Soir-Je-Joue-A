import { z } from "zod";

// Doit rester synchronise avec les id de front/src/composables/useCriteria.ts
// (MOODS/FATIGUES/TIMES/MOMENTS) : ce sont les memes vocabulaires metier.
const MOOD_COUNT = 6;

export const CriteriaSchema = z.object({
  moods: z
    .array(z.enum(["detente", "defi", "social", "decouverte", "nostalgie", "creatif"]))
    .min(1)
    .max(MOOD_COUNT)
    .transform((moods) => [...new Set(moods)]),
  fatigue: z.enum(["frais", "cava", "fatigue", "crame"]),
  time: z.enum(["30", "60", "120", "180"]),
  moment: z.enum(["matin", "aprem", "soiree", "nuit"]),
});

export type Criteria = z.infer<typeof CriteriaSchema>;
