import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/services/profile.service"
import { getRecentSessions } from "@/services/session.service"
import { getDisciplineMetrics } from "@/services/analytics.service"
import { getPuuid, getRankedStats } from "@/services/riot.service"
import { updateProfile } from "@/services/profile.service"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, ExternalLink, MapPin, Shield, Swords, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRole } from "@/lib/utils/format"

export const metadata = { title: "Profile" }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [profile, sessions, disciplineMetrics] = await Promise.all([
    getProfile(user.id),
    getRecentSessions(user.id, 5),
    getDisciplineMetrics(user.id),
  ])

  if (!profile) redirect("/onboarding")
  if (!profile.onboardingCompleted) redirect("/onboarding")

  // Fetch live rank from Riot API — cache it like Blitz does
  let riotRank = null
  if (profile.riotId && process.env.RIOT_API_KEY) {
    try {
      const puuid = await getPuuid(profile.riotId, profile.region ?? "EUW")
      riotRank = await getRankedStats(puuid, profile.region ?? "EUW")
      if (riotRank) {
        // Persist latest rank so it shows even when the split resets
        await updateProfile(user.id, { currentRank: riotRank.label })
      }
    } catch {
      // silently fall back to stored rank
    }
  }

  // Use stored rank as fallback (same approach as Blitz)
  const displayRank = riotRank ?? (profile.currentRank ? { label: profile.currentRank, lp: null, winRate: null, wins: null, losses: null } : null)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/profile/edit">
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
            {(profile.displayName ?? profile.username ?? "?")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{profile.displayName ?? profile.username}</h2>
              {profile.currentRank && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  {profile.currentRank}
                </span>
              )}
            </div>
            {profile.username && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
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
              {profile.lookingForDuo && (
                <span className="flex items-center gap-1 text-primary">
                  <Users className="h-3.5 w-3.5" />
                  Looking for duo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Riot ID + live rank */}
        {profile.riotId && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Riot ID</p>
                <p className="text-sm font-medium">{profile.riotId}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className={cn("h-4 w-4", profile.riotIdVerified ? "text-green-400" : "text-muted-foreground")} />
                <span className={cn("text-xs", profile.riotIdVerified ? "text-green-400" : "text-muted-foreground")}>
                  {profile.riotIdVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>

            {displayRank ? (
              <div className="grid gap-2" style={{ gridTemplateColumns: displayRank.lp !== null ? "repeat(3, 1fr)" : "1fr" }}>
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-center">
                  <p className="text-sm font-bold">{displayRank.label.split(" — ")[0]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {riotRank ? "Rank" : "Rank (vorig split)"}
                  </p>
                </div>
                {displayRank.lp !== null && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-center">
                    <p className="text-sm font-bold">{displayRank.lp} LP</p>
                    <p className="text-xs text-muted-foreground mt-0.5">LP</p>
                  </div>
                )}
                {displayRank.winRate !== null && (
                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-center">
                    <p className={cn("text-sm font-bold", displayRank.winRate >= 50 ? "win-text" : "loss-text")}>
                      {displayRank.winRate}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{displayRank.wins}W {displayRank.losses}L</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Nog geen ranked data beschikbaar</p>
                <Link href="/profile/edit" className="text-xs text-primary hover:underline">Handmatig instellen</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold">{profile.totalSessions}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sessions</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold">{profile.streakDays}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Day streak</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-center">
          <p className="text-2xl font-bold">{disciplineMetrics.score}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Discipline</p>
        </div>
      </div>

      {/* Public profile link */}
      {profile.username && profile.isPublic && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4">
          <div>
            <p className="text-sm font-medium">Public profile</p>
            <p className="text-xs text-muted-foreground">Anyone can view your profile</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href={`/p/${profile.username}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
