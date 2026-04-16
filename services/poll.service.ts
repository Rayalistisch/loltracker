/**
 * Background match poller — server-side only.
 * Called by the cron endpoint every minute.
 * Checks all active sessions, fetches new Riot matches, saves them to session_games.
 */

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { getPuuid, getMatchesSince } from "@/services/riot.service"

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServiceClient(url, key)
}

export interface PollResult {
  sessionsChecked: number
  newGames:        number
  errors:          string[]
}

export async function pollActiveSessions(): Promise<PollResult> {
  const supabase = serviceClient()
  const result: PollResult = { sessionsChecked: 0, newGames: 0, errors: [] }

  // 1. Fetch all active sessions that have a started_at
  const { data: sessions, error: sessErr } = await supabase
    .from("player_sessions")
    .select("id, user_id, started_at")
    .eq("status", "active")
    .not("started_at", "is", null)

  if (sessErr || !sessions?.length) return result

  // 2. For each session, look up the player's Riot ID + region
  for (const session of sessions) {
    result.sessionsChecked++

    try {
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("riot_id, region")
        .eq("id", session.user_id)
        .single()

      if (!profile?.riot_id) {
        console.log(`[poll] session ${session.id}: no riot_id, skipping`)
        continue
      }

      const region  = profile.region ?? "EUW"
      const sinceMs = new Date(session.started_at).getTime()
      console.log(`[poll] session ${session.id}: riot_id=${profile.riot_id} region=${region} since=${new Date(sinceMs).toISOString()}`)

      // 3. Fetch matches from Riot API since session start
      const puuid   = await getPuuid(profile.riot_id, region)
      console.log(`[poll] session ${session.id}: puuid=${puuid.slice(0, 12)}...`)
      const matches = await getMatchesSince(puuid, region, sinceMs)
      console.log(`[poll] session ${session.id}: ${matches.length} matches found`)
      if (!matches.length) continue

      // 4. Filter out matches we already have
      const { data: existing } = await supabase
        .from("session_games")
        .select("match_id")
        .eq("session_id", session.id)

      const seenIds = new Set((existing ?? []).map((r: { match_id: string }) => r.match_id))
      const newMatches = matches.filter(m => !seenIds.has(m.matchId))
      if (!newMatches.length) continue

      // 5. Insert new games
      const rows = newMatches.map(m => ({
        session_id:     session.id,
        user_id:        session.user_id,
        match_id:       m.matchId,
        result:         m.win ? "win" : "loss",
        champion:       m.champion,
        kills:          m.kills,
        deaths:         m.deaths,
        assists:        m.assists,
        cs:             m.cs,
        duration:       m.duration,
        vision_score:   m.visionScore ?? null,
        wards_placed:   m.wardsPlaced ?? null,
        wards_killed:   m.wardsKilled ?? null,
        control_wards:  m.controlWardsPlaced ?? null,
        cc_score:       m.ccScore ?? null,
        damage_to_champs: m.damageToChampions ?? null,
        heal_shield:    ((m.totalHeal ?? 0) + (m.totalShield ?? 0)) || null,
        gold_earned:    (m as { goldEarned?: number }).goldEarned ?? null,
        source:         "auto",
        played_at:      new Date(m.timestamp).toISOString(),
      }))

      const { error: insertErr } = await supabase
        .from("session_games")
        .upsert(rows, { onConflict: "session_id,match_id", ignoreDuplicates: true })

      if (insertErr) {
        result.errors.push(`Session ${session.id}: ${insertErr.message}`)
        continue
      }

      result.newGames += newMatches.length

      // 6. Update aggregate counts on the session
      const wins   = matches.filter(m => m.win).length
      const losses = matches.filter(m => !m.win).length

      await supabase
        .from("player_sessions")
        .update({
          games_won:    wins,
          games_lost:   losses,
          actual_games: wins + losses,
        })
        .eq("id", session.id)

    } catch (err) {
      result.errors.push(`Session ${session.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
