import { notFound } from "next/navigation"
import { getPublicProfile } from "@/services/profile.service"
import { createClient } from "@/lib/supabase/server"
import { formatRole } from "@/lib/utils/format"
import { MapPin, Swords, Trophy, Flame } from "lucide-react"

export const revalidate = 300 // ISR: revalidate every 5 minutes

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  return {
    title: `@${username} — Loltracker`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  const profile = await getPublicProfile(username)
  if (!profile) notFound()

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="font-bold tracking-tight">Loltracker</span>
          <span className="text-border/50">·</span>
          <span className="text-muted-foreground text-sm">@{profile.username}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {(profile.displayName ?? profile.username ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{profile.displayName ?? profile.username}</h1>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                {profile.region && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.region}
                  </span>
                )}
                {profile.mainRole && profile.mainRole !== "FILL" && (
                  <span className="flex items-center gap-1">
                    <Swords className="h-3.5 w-3.5" />
                    {formatRole(profile.mainRole)}
                    {profile.secondaryRole && ` / ${formatRole(profile.secondaryRole)}`}
                  </span>
                )}
                {profile.currentRank && (
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {profile.currentRank}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Public stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold">{profile.totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sessions</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              <Flame className="h-5 w-5 text-orange-400" />
              {profile.streakDays}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Day streak</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
            <p className="text-2xl font-bold">{profile.disciplineScore}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Discipline score</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Profile on{" "}
          <span className="text-primary font-semibold">Loltracker</span>
          {" "}— Track your ranked habits, not just stats
        </p>
      </div>
    </div>
  )
}
