import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPuuid, getRankedStats } from "@/services/riot.service"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("riot_id, region")
    .eq("user_id", user.id)
    .single()

  if (!profile?.riot_id) {
    return NextResponse.json({ rank: null, reason: "no_riot_id" })
  }

  try {
    const puuid = await getPuuid(profile.riot_id, profile.region ?? "EUW")
    const rank  = await getRankedStats(puuid, profile.region ?? "EUW")
    return NextResponse.json({ rank })
  } catch (err) {
    console.error("[riot/rank]", err)
    return NextResponse.json({ rank: null, reason: "api_error" })
  }
}
