import { createClient } from "@/lib/supabase/server"
import type { PlayerSession, PreGameCheckin, PostGameReflection } from "@/types/domain"
import type { Role } from "@/types/enums"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSession(row: Record<string, unknown>): PlayerSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    status: row.status as PlayerSession["status"],
    startedAt: row.started_at as string | null,
    endedAt: row.ended_at as string | null,
    plannedGames: row.planned_games as number | null,
    actualGames: row.actual_games as number | null,
    gamesWon: row.games_won as number | null,
    gamesLost: row.games_lost as number | null,
    rankAtStart: row.rank_at_start as string | null,
    rankAtEnd: row.rank_at_end as string | null,
    lpDelta: row.lp_delta as number | null,
    notes: row.notes as string | null,
    tiltScore: row.tilt_score as number | null,
    stopRecommended: row.stop_recommended as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapCheckin(row: Record<string, unknown>): PreGameCheckin {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    mentalState: row.mental_state as number,
    energyLevel: row.energy_level as number,
    tiltRisk: row.tilt_risk as number,
    goal: row.goal as string,
    plannedGames: row.planned_games as number,
    plannedRoles: (row.planned_roles as Role[]) ?? [],
    championPool: (row.champion_pool as string[]) ?? [],
    stopCondition: row.stop_condition as string | null,
    createdAt: row.created_at as string,
  }
}

function mapReflection(row: Record<string, unknown>): PostGameReflection {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    userId: row.user_id as string,
    followedStopCondition: row.followed_stop_condition as boolean,
    mentalStateEnd: row.mental_state_end as number,
    tiltMoments: row.tilt_moments as number,
    biggestMistake: row.biggest_mistake as string | null,
    whatWentWell: row.what_went_well as string | null,
    improvementFocus: row.improvement_focus as string | null,
    wouldPlayAgain: row.would_play_again as boolean | null,
    overallRating: row.overall_rating as number,
    createdAt: row.created_at as string,
  }
}

// ─── Session CRUD ─────────────────────────────────────────────────────────────

export async function getActiveSession(userId: string): Promise<PlayerSession | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("player_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return data ? mapSession(data) : null
}

export async function getSessionById(
  sessionId: string,
  userId: string
): Promise<PlayerSession | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("player_sessions")
    .select("*, pre_game_checkins(*), post_game_reflections(*)")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single()

  if (!data) return null

  const session = mapSession(data)
  if (data.pre_game_checkins) {
    session.preCheckin = mapCheckin(data.pre_game_checkins)
  }
  if (data.post_game_reflections) {
    session.postReflection = mapReflection(data.post_game_reflections)
  }
  return session
}

export async function getRecentSessions(
  userId: string,
  limit = 10
): Promise<PlayerSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("player_sessions")
    .select("*, pre_game_checkins(*), post_game_reflections(*)")
    .eq("user_id", userId)
    .in("status", ["completed", "abandoned"])
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []).map((row) => {
    const session = mapSession(row)
    if (row.pre_game_checkins) session.preCheckin = mapCheckin(row.pre_game_checkins)
    if (row.post_game_reflections) session.postReflection = mapReflection(row.post_game_reflections)
    return session
  })
}

export async function createSession(
  userId: string,
  data: { plannedGames: number; rankAtStart?: string }
): Promise<PlayerSession> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("player_sessions")
    .insert({
      user_id: userId,
      status: "pending",
      planned_games: data.plannedGames,
      rank_at_start: data.rankAtStart ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapSession(row)
}

export async function updateSession(
  sessionId: string,
  userId: string,
  data: Partial<{
    status: string
    startedAt: string
    endedAt: string
    gamesWon: number
    gamesLost: number
    actualGames: number
    rankAtEnd: string
    lpDelta: number
    tiltScore: number
    stopRecommended: boolean
    notes: string
  }>
): Promise<PlayerSession> {
  const supabase = await createClient()
  const update: Record<string, unknown> = {}

  if (data.status !== undefined) update.status = data.status
  if (data.startedAt !== undefined) update.started_at = data.startedAt
  if (data.endedAt !== undefined) update.ended_at = data.endedAt
  if (data.gamesWon !== undefined) update.games_won = data.gamesWon
  if (data.gamesLost !== undefined) update.games_lost = data.gamesLost
  if (data.actualGames !== undefined) update.actual_games = data.actualGames
  if (data.rankAtEnd !== undefined) update.rank_at_end = data.rankAtEnd
  if (data.lpDelta !== undefined) update.lp_delta = data.lpDelta
  if (data.tiltScore !== undefined) update.tilt_score = data.tiltScore
  if (data.stopRecommended !== undefined) update.stop_recommended = data.stopRecommended
  if (data.notes !== undefined) update.notes = data.notes

  const { data: row, error } = await supabase
    .from("player_sessions")
    .update(update)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) throw error
  return mapSession(row)
}

// ─── Check-ins & Reflections ──────────────────────────────────────────────────

export async function createPreGameCheckin(
  sessionId: string,
  userId: string,
  data: {
    mentalState: number
    energyLevel: number
    tiltRisk: number
    goal: string
    plannedGames: number
    plannedRoles: string[]
    championPool: string[]
    stopCondition?: string
  }
): Promise<PreGameCheckin> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("pre_game_checkins")
    .insert({
      session_id: sessionId,
      user_id: userId,
      mental_state: data.mentalState,
      energy_level: data.energyLevel,
      tilt_risk: data.tiltRisk,
      goal: data.goal,
      planned_games: data.plannedGames,
      planned_roles: data.plannedRoles,
      champion_pool: data.championPool,
      stop_condition: data.stopCondition ?? null,
    })
    .select()
    .single()

  if (error) throw error

  // Activate session
  await supabase
    .from("player_sessions")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId)

  return mapCheckin(row)
}

export async function createPostGameReflection(
  sessionId: string,
  userId: string,
  data: {
    followedStopCondition: boolean
    mentalStateEnd: number
    tiltMoments: number
    biggestMistake?: string
    whatWentWell?: string
    improvementFocus?: string
    wouldPlayAgain?: boolean
    overallRating: number
    actualGames: number
    gamesWon: number
    gamesLost: number
    rankAtEnd?: string
    lpDelta?: number
    tiltScore?: number
  }
): Promise<PostGameReflection> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("post_game_reflections")
    .insert({
      session_id: sessionId,
      user_id: userId,
      followed_stop_condition: data.followedStopCondition,
      mental_state_end: data.mentalStateEnd,
      tilt_moments: data.tiltMoments,
      biggest_mistake: data.biggestMistake ?? null,
      what_went_well: data.whatWentWell ?? null,
      improvement_focus: data.improvementFocus ?? null,
      would_play_again: data.wouldPlayAgain ?? null,
      overall_rating: data.overallRating,
    })
    .select()
    .single()

  if (error) throw error

  // Close session
  await supabase
    .from("player_sessions")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      actual_games: data.actualGames,
      games_won: data.gamesWon,
      games_lost: data.gamesLost,
      rank_at_end: data.rankAtEnd ?? null,
      lp_delta: data.lpDelta ?? null,
      tilt_score: data.tiltScore ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)

  // Increment total_sessions on profile
  await supabase.rpc("increment_total_sessions", { user_id_param: userId })

  return mapReflection(row)
}
