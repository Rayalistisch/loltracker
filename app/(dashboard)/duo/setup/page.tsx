import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyDuoProfile } from "@/services/duo.service"
import { DuoProfileForm } from "@/components/features/duo/DuoProfileForm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Duo Profile Setup" }

export default async function DuoSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const existing = await getMyDuoProfile(user.id)

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <Link
        href="/duo"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Duo
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-1">
        {existing ? "Edit Duo Profile" : "Set Up Duo Profile"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Your duo profile is used to find compatible partners
      </p>
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <DuoProfileForm existing={existing} />
      </div>
    </div>
  )
}
