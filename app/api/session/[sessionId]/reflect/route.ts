import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { postGameReflectionSchema } from "@/lib/validators/session"
import { createPostGameReflection } from "@/services/session.service"
import { computeTiltScore } from "@/lib/engines/tilt-engine"
import { getRecentSessions } from "@/services/session.service"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { sessionId } = await params
    const body = await request.json()
    const result = postGameReflectionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    // Compute tilt score from recent sessions + this reflection
    const recentSessions = await getRecentSessions(user.id, 10)
    const tiltAnalysis = computeTiltScore(recentSessions, result.data)

    const reflection = await createPostGameReflection(sessionId, user.id, {
      ...result.data,
      wouldPlayAgain: result.data.wouldPlayAgain ?? undefined,
      tiltScore: tiltAnalysis.currentScore,
    })

    return NextResponse.json({ data: reflection, tiltAnalysis })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 })
  }
}
