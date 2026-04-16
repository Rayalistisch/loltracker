import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Notification Settings" }

export default async function NotificationSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose what you hear about</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email</h2>
        <NotifRow label="Weekly summaries" description="Your session recap every Monday" enabled={settings?.email_weekly_summary as boolean ?? true} />
        <NotifRow label="Duo requests" description="When someone wants to duo with you" enabled={settings?.email_duo_requests as boolean ?? true} />
        <NotifRow label="Streak reminders" description="Keep your session streak alive" enabled={settings?.email_streak_reminders as boolean ?? false} />
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">In-App</h2>
        <NotifRow label="Duo requests" description="Badge when you receive a request" enabled={settings?.in_app_duo_requests as boolean ?? true} />
        <NotifRow label="Stop recommendations" description="Alert when tilt score is high" enabled={settings?.in_app_stop_recommendations as boolean ?? true} />
      </div>
    </div>
  )
}

function NotifRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={`w-10 h-6 rounded-full border ${enabled ? "bg-primary border-primary" : "bg-muted border-border"} relative`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${enabled ? "left-4" : "left-0.5"}`} />
      </div>
    </div>
  )
}
