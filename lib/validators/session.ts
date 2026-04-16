import { z } from "zod"

export const createSessionSchema = z.object({
  plannedGames: z.number().int().min(1).max(20),
  rankAtStart: z.string().optional(),
})

export const preGameCheckinSchema = z.object({
  mentalState: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  tiltRisk: z.number().int().min(1).max(5),
  goal: z.string().min(1, "Choose a goal"),
  plannedGames: z.number().int().min(1).max(20),
  plannedRoles: z.array(z.string()).min(1, "Select at least one role"),
  championPool: z.array(z.string()),
  stopCondition: z.string().optional(),
})

// Fields the user fills in the reflection form
export const postGameReflectionFormSchema = z.object({
  followedStopCondition: z.boolean(),
  mentalStateEnd: z.number().int().min(1).max(5),
  tiltMoments: z.number().int().min(0).max(20),
  lpDelta: z.number().int().optional().nullable(),
  biggestMistake: z.string().optional(),
  whatWentWell: z.string().optional(),
  improvementFocus: z.string().optional(),
  wouldPlayAgain: z.boolean().nullable().optional(),
  overallRating: z.number().int().min(1).max(5),
})

// Full API payload (form fields + session game counts from state)
export const postGameReflectionSchema = postGameReflectionFormSchema.extend({
  actualGames: z.number().int().min(0),
  gamesWon: z.number().int().min(0),
  gamesLost: z.number().int().min(0),
  checkinMentalState: z.number().int().min(1).max(5).optional(),
  rankAtEnd: z.string().optional(),
  lpDelta: z.number().int().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type PreGameCheckinInput = z.infer<typeof preGameCheckinSchema>
export type PostGameReflectionFormInput = z.infer<typeof postGameReflectionFormSchema>
export type PostGameReflectionInput = z.infer<typeof postGameReflectionSchema>
