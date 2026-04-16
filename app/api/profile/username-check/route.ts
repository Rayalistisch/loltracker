import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isUsernameAvailable } from "@/services/profile.service"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const username = request.nextUrl.searchParams.get("username")
  if (!username || username.length < 3) {
    return NextResponse.json({ available: false })
  }

  const available = await isUsernameAvailable(username, user.id)
  return NextResponse.json({ available })
}
