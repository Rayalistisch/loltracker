import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Account Settings" }

export default async function AccountSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Email address</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="border-t border-border/50 pt-4">
          <p className="text-sm font-medium mb-1">Account ID</p>
          <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-base font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back.
        </p>
        <Button variant="destructive" size="sm" disabled>
          Delete Account
        </Button>
      </div>
    </div>
  )
}
