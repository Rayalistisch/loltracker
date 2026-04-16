"use client"

import { useState } from "react"
import { toast } from "sonner"
import { MapPin, Users, MessageSquare, Zap, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatRole } from "@/lib/utils/format"
import type { DuoMatchCandidate } from "@/types/domain"

interface DuoCardProps {
  candidate: DuoMatchCandidate
  hasRequested?: boolean
}

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-green-400" :
  score >= 60 ? "text-blue-400" :
  score >= 40 ? "text-yellow-400" :
  "text-muted-foreground"

const SCORE_BG = (score: number) =>
  score >= 80 ? "bg-green-500/10 border-green-500/30" :
  score >= 60 ? "bg-blue-500/10 border-blue-500/30" :
  score >= 40 ? "bg-yellow-500/10 border-yellow-500/30" :
  "bg-muted/20 border-border/40"

export function DuoCard({ candidate, hasRequested = false }: DuoCardProps) {
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(hasRequested)

  const profile = candidate.profile
  const name = profile?.displayName ?? profile?.username ?? "Unknown"
  const initial = name[0].toUpperCase()

  async function sendRequest() {
    setLoading(true)
    try {
      const res = await fetch("/api/duo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: candidate.userId,
          compatibilityScore: candidate.compatibilityScore,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRequested(true)
      toast.success(`Request sent to ${name}!`)
    } catch (err) {
      if (err instanceof Error && err.message.includes("already")) {
        toast.error("You already sent a request to this player")
        setRequested(true)
      } else {
        toast.error("Failed to send request")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 hover:border-border/80 transition-all p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {initial}
          </div>
          <div>
            <p className="font-semibold">{name}</p>
            {profile?.username && (
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            )}
          </div>
        </div>

        {/* Compatibility score */}
        <div className={cn(
          "rounded-xl border px-3 py-1.5 text-center",
          SCORE_BG(candidate.compatibilityScore)
        )}>
          <div className={cn("text-xl font-bold tabular-nums", SCORE_COLOR(candidate.compatibilityScore))}>
            {candidate.compatibilityScore}
          </div>
          <div className="text-xs text-muted-foreground">match</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {profile?.region && (
          <Tag icon={<MapPin className="h-3 w-3" />}>{profile.region}</Tag>
        )}
        {profile?.currentRank && (
          <Tag>{profile.currentRank}</Tag>
        )}
        {candidate.preferredRoles.slice(0, 2).map((role) => (
          <Tag key={role}>{formatRole(role)}</Tag>
        ))}
        {candidate.vibeTags.slice(0, 2).map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>

      {/* Bio */}
      {candidate.bioDuo && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{candidate.bioDuo}</p>
      )}

      {/* Score breakdown */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {[
          { label: "Rank", score: candidate.scoreBreakdown.rankScore },
          { label: "Role", score: candidate.scoreBreakdown.roleScore },
          { label: "Avail", score: candidate.scoreBreakdown.availabilityScore },
          { label: "Vibe", score: candidate.scoreBreakdown.vibeScore },
          { label: "Comms", score: candidate.scoreBreakdown.communicationScore },
        ].map(({ label, score }) => (
          <div key={label} className="text-center">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      <Button
        onClick={sendRequest}
        disabled={loading || requested}
        variant={requested ? "outline" : "default"}
        size="sm"
        className="w-full gap-1.5"
      >
        {requested ? (
          <>
            <Check className="h-4 w-4" />
            Request Sent
          </>
        ) : (
          <>
            <Users className="h-4 w-4" />
            {loading ? "Sending…" : "Connect"}
          </>
        )}
      </Button>
    </div>
  )
}

function Tag({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
      {icon}
      {children}
    </span>
  )
}
