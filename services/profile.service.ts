import { createClient } from "@/lib/supabase/server"
import type { PlayerProfile } from "@/types/domain"

function mapProfile(row: Record<string, unknown>): PlayerProfile {
  return {
    id: row.id as string,
    username: row.username as string | null,
    displayName: row.display_name as string | null,
    avatarUrl: row.avatar_url as string | null,
    bio: row.bio as string | null,
    region: row.region as string,
    riotId: row.riot_id as string | null,
    riotIdVerified: row.riot_id_verified as boolean,
    peakRank: row.peak_rank as string | null,
    currentRank: row.current_rank as string | null,
    mainRole: row.main_role as string,
    secondaryRole: row.secondary_role as string | null,
    playstyleTags: (row.playstyle_tags as string[] | null) ?? [],
    lookingForDuo: row.looking_for_duo as boolean,
    isPublic: row.is_public as boolean,
    onboardingCompleted: row.onboarding_completed as boolean,
    disciplineScore: row.discipline_score as number,
    streakDays: row.streak_days as number,
    totalSessions: row.total_sessions as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getProfile(userId: string): Promise<PlayerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data ? mapProfile(data) : null
}

export async function getPublicProfile(username: string): Promise<PlayerProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .single()
  return data ? mapProfile(data) : null
}

export async function updateProfile(
  userId: string,
  updates: Partial<{
    username: string
    displayName: string
    bio: string
    region: string
    mainRole: string
    secondaryRole: string
    riotId: string
    lookingForDuo: boolean
    isPublic: boolean
    playstyleTags: string[]
    onboardingCompleted: boolean
    currentRank: string
  }>
): Promise<PlayerProfile> {
  const supabase = await createClient()
  const mapped: Record<string, unknown> = {}

  if (updates.username !== undefined) mapped.username = updates.username
  if (updates.displayName !== undefined) mapped.display_name = updates.displayName
  if (updates.bio !== undefined) mapped.bio = updates.bio
  if (updates.region !== undefined) mapped.region = updates.region
  if (updates.mainRole !== undefined) mapped.main_role = updates.mainRole
  if (updates.secondaryRole !== undefined) mapped.secondary_role = updates.secondaryRole
  if (updates.riotId !== undefined) mapped.riot_id = updates.riotId
  if (updates.lookingForDuo !== undefined) mapped.looking_for_duo = updates.lookingForDuo
  if (updates.isPublic !== undefined) mapped.is_public = updates.isPublic
  if (updates.playstyleTags !== undefined) mapped.playstyle_tags = updates.playstyleTags
  if (updates.onboardingCompleted !== undefined) mapped.onboarding_completed = updates.onboardingCompleted
  if (updates.currentRank !== undefined) mapped.current_rank = updates.currentRank

  const { data, error } = await supabase
    .from("player_profiles")
    .update(mapped)
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error
  return mapProfile(data)
}

export async function isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  const supabase = await createClient()
  const query = supabase
    .from("player_profiles")
    .select("id")
    .eq("username", username)

  const { data } = await query
  if (!data || data.length === 0) return true
  if (currentUserId && data.length === 1 && (data[0] as { id: string }).id === currentUserId) return true
  return false
}
