import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { duoProfileSchema } from "@/lib/validators/duo"
import { upsertDuoProfile } from "@/services/duo.service"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const result = duoProfileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  try {
    const profile = await upsertDuoProfile(user.id, {
      ...result.data,
      rankMin: result.data.rankMin ?? null,
      rankMax: result.data.rankMax ?? null,
      availability: result.data.availability ?? {},
      bioDuo: result.data.bioDuo ?? null,
    })
    return NextResponse.json({ data: profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
