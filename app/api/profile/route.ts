import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { profileEditSchema } from "@/lib/validators/profile"
import { updateProfile } from "@/services/profile.service"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  // If onboarding, use the full onboarding data; otherwise use edit schema
  const { onboardingCompleted, username, ...rest } = body

  try {
    const profile = await updateProfile(user.id, {
      ...rest,
      ...(username ? { username } : {}),
      ...(onboardingCompleted !== undefined ? { onboardingCompleted } : {}),
    })
    return NextResponse.json({ data: profile })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
