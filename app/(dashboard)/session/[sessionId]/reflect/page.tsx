import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PostGameReflectionForm } from "@/components/features/session/PostGameReflectionForm"

export const metadata = { title: "Session Reflection" }

interface Props {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{
    won?: string
    lost?: string
    total?: string
  }>
}

export default async function ReflectPage({ params, searchParams }: Props) {
  const { sessionId } = await params
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: session } = await supabase
    .from("player_sessions")
    .select("*, pre_game_checkins(*)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single()

  if (!session) notFound()

  // If already reflected, go to session detail (or dashboard for now)
  const { data: existingReflection } = await supabase
    .from("post_game_reflections")
    .select("id")
    .eq("session_id", sessionId)
    .single()

  if (existingReflection) redirect("/dashboard")

  const checkin = session.pre_game_checkins as Record<string, unknown> | null
  const checkinMentalState = checkin ? (checkin.mental_state as number) : 3

  // Game counts from URL params (set by ActiveSessionPanel) or session row
  const gamesWon = sp.won
    ? parseInt(sp.won)
    : (session.games_won as number | null) ?? 0
  const gamesLost = sp.lost
    ? parseInt(sp.lost)
    : (session.games_lost as number | null) ?? 0
  const actualGames = sp.total
    ? parseInt(sp.total)
    : (session.actual_games as number | null) ?? gamesWon + gamesLost

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Session Reflection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Take a moment to review what happened
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6">
        <PostGameReflectionForm
          sessionId={sessionId}
          gamesWon={gamesWon}
          gamesLost={gamesLost}
          actualGames={actualGames}
          checkinMentalState={checkinMentalState}
        />
      </div>
    </div>
  )
}
