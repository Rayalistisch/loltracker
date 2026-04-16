import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { duoRequestSchema } from "@/lib/validators/duo"
import { sendDuoRequest } from "@/services/duo.service"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const result = duoRequestSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  try {
    const req = await sendDuoRequest(
      user.id,
      result.data.receiverId,
      result.data.message,
      body.compatibilityScore
    )
    return NextResponse.json({ data: req })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    // Handle unique constraint (already sent request)
    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({ error: "Request already sent" }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
