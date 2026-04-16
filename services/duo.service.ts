import { createClient } from "@/lib/supabase/server"
import type { DuoProfile, DuoMatchRequest, DuoMatchCandidate } from "@/types/domain"
import { scoreDuoCandidates } from "@/lib/engines/duo-matching"
import type { AvailabilityMap } from "@/types/domain"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDuoProfile(row: Record<string, unknown>, profile: Record<string, unknown>): DuoProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    isActive: row.is_active as boolean,
    preferredRoles: (row.preferred_roles as string[] | null) ?? [],
    preferredPartnerRoles: (row.preferred_partner_roles as string[] | null) ?? [],
    rankMin: row.rank_min as string | null,
    rankMax: row.rank_max as string | null,
    communicationStyle: (row.communication_style as string[] | null) ?? [],
    vibeTags: (row.vibe_tags as string[] | null) ?? [],
    languages: (row.languages as string[] | null) ?? [],
    availability: (row.availability as AvailabilityMap | null) ?? {},
    bioDuo: row.bio_duo as string | null,
    lastActiveAt: row.last_active_at as string | null,
    // Joined profile data
    profile: {
      id: profile.id as string,
      username: profile.username as string | null,
      displayName: profile.display_name as string | null,
      avatarUrl: profile.avatar_url as string | null,
      bio: profile.bio as string | null,
      region: profile.region as string,
      riotId: profile.riot_id as string | null,
      riotIdVerified: profile.riot_id_verified as boolean,
      peakRank: profile.peak_rank as string | null,
      currentRank: profile.current_rank as string | null,
      mainRole: profile.main_role as string,
      secondaryRole: profile.secondary_role as string | null,
      playstyleTags: (profile.playstyle_tags as string[] | null) ?? [],
      lookingForDuo: profile.looking_for_duo as boolean,
      isPublic: profile.is_public as boolean,
      onboardingCompleted: profile.onboarding_completed as boolean,
      disciplineScore: profile.discipline_score as number,
      streakDays: profile.streak_days as number,
      totalSessions: profile.total_sessions as number,
      createdAt: profile.created_at as string,
      updatedAt: profile.updated_at as string,
    },
  }
}

// ─── Duo profile CRUD ─────────────────────────────────────────────────────────

export async function getMyDuoProfile(userId: string): Promise<DuoProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("duo_profiles")
    .select("*, player_profiles(*)")
    .eq("user_id", userId)
    .single()

  if (!data) return null
  return mapDuoProfile(data, data.player_profiles as Record<string, unknown>)
}

export async function upsertDuoProfile(
  userId: string,
  input: Omit<DuoProfile, "id" | "userId" | "lastActiveAt" | "profile">
): Promise<DuoProfile> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("duo_profiles")
    .upsert({
      user_id: userId,
      is_active: input.isActive,
      preferred_roles: input.preferredRoles,
      preferred_partner_roles: input.preferredPartnerRoles,
      rank_min: input.rankMin ?? null,
      rank_max: input.rankMax ?? null,
      communication_style: input.communicationStyle,
      vibe_tags: input.vibeTags,
      languages: input.languages,
      availability: input.availability ?? {},
      bio_duo: input.bioDuo ?? null,
      last_active_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("*, player_profiles(*)")
    .single()

  if (error) throw error
  return mapDuoProfile(data, data.player_profiles as Record<string, unknown>)
}

// ─── Browse candidates ────────────────────────────────────────────────────────

export async function getDuoCandidates(
  userId: string,
  myDuoProfile: DuoProfile,
  filters?: { region?: string; role?: string; rankMin?: string; rankMax?: string }
): Promise<DuoMatchCandidate[]> {
  const supabase = await createClient()

  let query = supabase
    .from("duo_profiles")
    .select("*, player_profiles(*)")
    .eq("is_active", true)
    .neq("user_id", userId)
    .limit(50)

  const { data } = await query

  if (!data) return []

  const candidates = data
    .map((row) => {
      const profile = row.player_profiles as Record<string, unknown>
      // Filter by region
      if (filters?.region && (profile.region as string) !== filters.region) return null
      // Filter by role
      if (filters?.role) {
        const preferredRoles = (row.preferred_roles as string[] | null) ?? []
        if (!preferredRoles.includes(filters.role)) return null
      }
      return mapDuoProfile(row, profile)
    })
    .filter((d): d is DuoProfile => d !== null)

  return scoreDuoCandidates({ viewer: myDuoProfile, candidates })
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function getIncomingRequests(userId: string): Promise<DuoMatchRequest[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("duo_match_requests")
    .select("*")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (data ?? []).map(mapRequest)
}

export async function getOutgoingRequests(userId: string): Promise<DuoMatchRequest[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("duo_match_requests")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  return (data ?? []).map(mapRequest)
}

export async function sendDuoRequest(
  senderId: string,
  receiverId: string,
  message?: string,
  compatibilityScore?: number
): Promise<DuoMatchRequest> {
  const supabase = await createClient()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("duo_match_requests")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      message: message ?? null,
      compatibility_score: compatibilityScore ?? null,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw error
  return mapRequest(data)
}

export async function updateRequestStatus(
  requestId: string,
  userId: string,
  status: "accepted" | "declined"
): Promise<DuoMatchRequest> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("duo_match_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .select()
    .single()

  if (error) throw error
  return mapRequest(data)
}

// ─── Saved duos ───────────────────────────────────────────────────────────────

export async function getSavedDuos(userId: string): Promise<{ savedUserId: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("saved_duos")
    .select("saved_user_id")
    .eq("user_id", userId)

  return (data ?? []).map((r) => ({ savedUserId: r.saved_user_id as string }))
}

function mapRequest(row: Record<string, unknown>): DuoMatchRequest {
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    receiverId: row.receiver_id as string,
    status: row.status as DuoMatchRequest["status"],
    message: row.message as string | null,
    compatibilityScore: row.compatibility_score as number | null,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}
