import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getActiveSession } from "@/services/session.service"
import { PageHeader } from "@/components/layouts/PageHeader"
import { PreGameCheckinForm } from "@/components/features/session/PreGameCheckinForm"

export const metadata: Metadata = { title: "Start Session" }

export default async function NewSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Redirect to active session if one exists
  const activeSession = await getActiveSession(user.id)
  if (activeSession) {
    redirect("/session/active")
  }

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("current_rank, main_role")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="Start a session"
        description="Check in before you queue. Takes 30 seconds."
      />
      <PreGameCheckinForm
        currentRank={profile?.current_rank ?? null}
        defaultRole={profile?.main_role ?? "FILL"}
      />
    </div>
  )
}
