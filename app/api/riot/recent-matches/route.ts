import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPuuid, getMatchesSince } from "@/services/riot.service"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Fetch session (verify ownership + get start time)
  const { data: session } = await supabase
    .from("player_sessions")
    .select("started_at, user_id")
    .eq("id", sessionId)
    .single()

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // Fetch Riot ID + region from profile
  const { data: profile } = await supabase
    .from("player_profiles")
    .select("riot_id, region")
    .eq("id", user.id)
    .single()

  if (!profile?.riot_id) {
    return NextResponse.json({ matches: [], reason: "no_riot_id" })
  }

  const sinceMs = session.started_at
    ? new Date(session.started_at).getTime()
    : Date.now() - 4 * 60 * 60 * 1000 // fallback: last 4h

  try {
    const puuid   = await getPuuid(profile.riot_id, profile.region ?? "EUW")
    const matches = await getMatchesSince(puuid, profile.region ?? "EUW", sinceMs)
    return NextResponse.json({ matches })
  } catch (err) {
    console.error("[riot/recent-matches]", err)
    return NextResponse.json(
      { matches: [], error: err instanceof Error ? err.message : "Riot API error" },
      { status: 502 }
    )
  }
}
