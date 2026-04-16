import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getActiveSession } from "@/services/session.service"
import { ActiveSessionPanel } from "@/components/features/session/ActiveSessionPanel"

export const metadata = { title: "Active Session" }

export default async function ActiveSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const session = await getActiveSession(user.id)
  if (!session) redirect("/session/new")

  // Need the checkin to display session plan info
  const { data: checkinRow } = await supabase
    .from("pre_game_checkins")
    .select("*")
    .eq("session_id", session.id)
    .single()

  if (!checkinRow) redirect("/session/new")

  const checkin = {
    id: checkinRow.id as string,
    sessionId: checkinRow.session_id as string,
    userId: checkinRow.user_id as string,
    mentalState: checkinRow.mental_state as number,
    energyLevel: checkinRow.energy_level as number,
    tiltRisk: checkinRow.tilt_risk as number,
    goal: checkinRow.goal as string,
    plannedGames: checkinRow.planned_games as number,
    plannedRoles: (checkinRow.planned_roles ?? []) as string[],
    championPool: (checkinRow.champion_pool ?? []) as string[],
    stopCondition: (checkinRow.stop_condition as string | null) ?? null,
    createdAt: checkinRow.created_at as string,
  }

  const { data: profileData } = await supabase
    .from("player_profiles")
    .select("riot_id")
    .eq("id", user.id)
    .single()

  const hasRiotId = !!(profileData?.riot_id && process.env.RIOT_API_KEY)

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight">Active Session</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hasRiotId ? "Games are detected automatically from your match history" : "Track your games and stay in control"}
        </p>
      </div>
      <ActiveSessionPanel session={session} checkin={checkin as never} hasRiotId={hasRiotId} />
    </div>
  )
}
