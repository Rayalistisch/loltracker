import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard"

export const metadata = { title: "Welcome to Loltracker" }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  if (profile?.onboarding_completed) redirect("/dashboard")

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Loltracker</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Let&apos;s set up your profile in under a minute
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6">
        <OnboardingWizard />
      </div>
    </div>
  )
}
