import { createClient } from "@/lib/supabase/server"
import { computeTiltScore } from "@/lib/engines/tilt-engine"
import { computeDisciplineScore } from "@/lib/engines/discipline-score"
import { getRecentSessions } from "./session.service"
import type { TiltAnalysis, DisciplineMetrics } from "@/types/domain"
import { startOfWeek, format, subWeeks, eachDayOfInterval, startOfDay } from "date-fns"

export async function getTiltAnalysis(userId: string): Promise<TiltAnalysis> {
  const sessions = await getRecentSessions(userId, 10)
  return computeTiltScore(sessions)
}

export async function getDisciplineMetrics(userId: string): Promise<DisciplineMetrics> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("streak_days")
    .eq("id", userId)
    .single()

  const streakDays = (profile?.streak_days as number | null) ?? 0
  const sessions = await getRecentSessions(userId, 20)

  return computeDisciplineScore(sessions, streakDays)
}

export interface HeatmapDay {
  date: string
  count: number
}

export async function getSessionHeatmap(
  userId: string,
  weeks = 12
): Promise<HeatmapDay[]> {
  const supabase = await createClient()

  const since = subWeeks(startOfDay(new Date()), weeks)

  const { data } = await supabase
    .from("player_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .in("status", ["completed", "abandoned"])
    .gte("created_at", since.toISOString())

  const countsByDate: Record<string, number> = {}
  ;(data ?? []).forEach((row) => {
    const date = (row.created_at as string).slice(0, 10)
    countsByDate[date] = (countsByDate[date] ?? 0) + 1
  })

  const days = eachDayOfInterval({
    start: since,
    end: startOfDay(new Date()),
  })

  return days.map((d) => {
    const date = format(d, "yyyy-MM-dd")
    return { date, count: countsByDate[date] ?? 0 }
  })
}

export interface WeeklyStat {
  weekLabel: string
  sessions: number
  games: number
  wins: number
  disciplineScore: number
}

export async function getWeeklyStats(userId: string, weeks = 8): Promise<WeeklyStat[]> {
  const sessions = await getRecentSessions(userId, 100)

  const buckets: Record<string, WeeklyStat> = {}

  sessions.forEach((session) => {
    const weekStart = format(startOfWeek(new Date(session.createdAt)), "yyyy-MM-dd")
    if (!buckets[weekStart]) {
      buckets[weekStart] = {
        weekLabel: format(new Date(weekStart), "MMM d"),
        sessions: 0,
        games: 0,
        wins: 0,
        disciplineScore: 50,
      }
    }
    buckets[weekStart].sessions += 1
    buckets[weekStart].games += session.actualGames ?? 0
    buckets[weekStart].wins += session.gamesWon ?? 0
  })

  return Object.values(buckets).slice(0, weeks).reverse()
}
