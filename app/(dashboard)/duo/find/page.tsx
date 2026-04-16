import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyDuoProfile, getDuoCandidates } from "@/services/duo.service"
import { DuoCard } from "@/components/features/duo/DuoCard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, AlertTriangle } from "lucide-react"

export const metadata = { title: "Find Duo" }

interface Props {
  searchParams: Promise<{ region?: string; role?: string }>
}

export default async function FindDuoPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const myDuoProfile = await getMyDuoProfile(user.id)

  if (!myDuoProfile) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-xl font-bold mb-2">Set up your duo profile first</h1>
        <p className="text-sm text-muted-foreground mb-4">
          You need a duo profile to browse and match with other players.
        </p>
        <Button asChild>
          <Link href="/duo/setup">Set Up Duo Profile</Link>
        </Button>
      </div>
    )
  }

  const candidates = await getDuoCandidates(user.id, myDuoProfile, {
    region: sp.region,
    role: sp.role,
  })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find Duo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sorted by compatibility with your profile
          </p>
        </div>
        <Link href="/duo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Duo
        </Link>
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">No duo candidates yet</p>
          <p className="text-sm text-muted-foreground">
            No other players have set up duo profiles yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map((candidate) => (
            <DuoCard
              key={candidate.userId}
              candidate={candidate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
