import { NextRequest, NextResponse } from "next/server"
import { pollActiveSessions } from "@/services/poll.service"

export const maxDuration = 60 // Vercel: allow up to 60s for this route

export async function GET(req: NextRequest) {
  // Protect with a secret so random people can't trigger it
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await pollActiveSessions()
  console.log("[cron] poll-matches:", result)

  return NextResponse.json(result)
}
