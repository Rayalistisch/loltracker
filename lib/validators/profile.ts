import { z } from "zod"

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only"),
  displayName: z.string().min(1, "Required").max(32),
  region: z.string().min(1, "Select a region"),
  mainRole: z.string().min(1, "Select a main role"),
  secondaryRole: z.string().optional(),
  riotId: z.string().optional(),
  bio: z.string().max(200).optional(),
})

export const profileEditSchema = z.object({
  displayName: z.string().min(1).max(32),
  bio: z.string().max(200).optional(),
  region: z.string().min(1),
  mainRole: z.string().min(1),
  secondaryRole: z.string().optional(),
  riotId: z.string().optional(),
  currentRank: z.string().optional(),
  lookingForDuo: z.boolean(),
  isPublic: z.boolean(),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
export type ProfileEditInput = z.infer<typeof profileEditSchema>
