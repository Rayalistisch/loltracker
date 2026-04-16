import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { preGameCheckinSchema } from "@/lib/validators/session"
import { createPreGameCheckin } from "@/services/session.service"

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
    const result = preGameCheckinSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const checkin = await createPreGameCheckin(sessionId, user.id, result.data)
    return NextResponse.json({ data: checkin })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save check-in" }, { status: 500 })
  }
}
