import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/layouts/DashboardSidebar"
import { DashboardTopbar } from "@/components/layouts/DashboardTopbar"
import type { PlayerProfile } from "@/types/domain"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch player profile
  const { data: profileData } = await supabase
    .from("player_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile: PlayerProfile | null = profileData
    ? {
        id: profileData.id,
        username: profileData.username,
        displayName: profileData.display_name,
        avatarUrl: profileData.avatar_url,
        bio: profileData.bio,
        region: profileData.region,
        riotId: profileData.riot_id,
        riotIdVerified: profileData.riot_id_verified,
        peakRank: profileData.peak_rank,
        currentRank: profileData.current_rank,
        mainRole: profileData.main_role,
        secondaryRole: profileData.secondary_role,
        playstyleTags: profileData.playstyle_tags ?? [],
        lookingForDuo: profileData.looking_for_duo,
        isPublic: profileData.is_public,
        onboardingCompleted: profileData.onboarding_completed,
        disciplineScore: profileData.discipline_score,
        streakDays: profileData.streak_days,
        totalSessions: profileData.total_sessions,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      }
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex md:shrink-0">
        <DashboardSidebar profile={profile} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar profile={profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
