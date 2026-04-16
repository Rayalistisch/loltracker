import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/services/profile.service"
import { ProfileEditForm } from "@/components/features/profile/ProfileEditForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Edit Profile" }

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const profile = await getProfile(user.id)
  if (!profile) redirect("/onboarding")

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <Link
        href="/profile"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Profile</h1>
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  )
}
