import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = { title: "Privacy Settings" }

export default async function PrivacySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("player_profiles")
    .select("is_public, looking_for_duo")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy</h1>
        <p className="text-sm text-muted-foreground mt-1">Control what others can see</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <PrivacyRow
          label="Public profile"
          description="Anyone can view your profile at /p/username"
          enabled={profile?.is_public as boolean ?? true}
        />
        <PrivacyRow
          label="Visible in duo finder"
          description="Your profile appears in the duo matching list"
          enabled={profile?.looking_for_duo as boolean ?? false}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Change these settings on the{" "}
        <Link href="/profile/edit" className="text-primary hover:underline">
          Edit Profile
        </Link>{" "}
        page
      </p>
    </div>
  )
}

function PrivacyRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        enabled ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
      }`}>
        {enabled ? "On" : "Off"}
      </span>
    </div>
  )
}
