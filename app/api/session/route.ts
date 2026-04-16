import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createSessionSchema } from "@/lib/validators/session"
import { createSession } from "@/services/session.service"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const result = createSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const session = await createSession(user.id, result.data)
    return NextResponse.json({ data: session })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
