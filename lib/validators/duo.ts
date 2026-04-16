import { z } from "zod"

export const duoProfileSchema = z.object({
  isActive: z.boolean(),
  preferredRoles: z.array(z.string()).min(1, "Select at least one role"),
  preferredPartnerRoles: z.array(z.string()),
  rankMin: z.string().optional(),
  rankMax: z.string().optional(),
  communicationStyle: z.array(z.string()),
  vibeTags: z.array(z.string()),
  languages: z.array(z.string()),
  bioDuo: z.string().max(300).optional(),
  availability: z.record(z.string(), z.array(z.number())).optional(),
})

export const duoRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().max(300).optional(),
})

export type DuoProfileInput = z.infer<typeof duoProfileSchema>
export type DuoRequestInput = z.infer<typeof duoRequestSchema>
