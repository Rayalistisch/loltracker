import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyDuoProfile, getIncomingRequests, getOutgoingRequests } from "@/services/duo.service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Bell, Search, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRole } from "@/lib/utils/format"

export const metadata = { title: "Duo" }

export default async function DuoHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [duoProfile, incoming, outgoing] = await Promise.all([
    getMyDuoProfile(user.id),
    getIncomingRequests(user.id),
    getOutgoingRequests(user.id),
  ])

  const pendingOutgoing = outgoing.filter((r) => r.status === "pending")
  const accepted = outgoing.filter((r) => r.status === "accepted")

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Duo Finder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find compatible duo partners by mentality and playstyle
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/duo/find">
            <Search className="h-4 w-4" />
            Find Duos
          </Link>
        </Button>
      </div>

      {/* Duo profile status */}
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold mb-1">Your Duo Profile</h2>
            {duoProfile ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    duoProfile.isActive ? "bg-green-400" : "bg-muted"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {duoProfile.isActive ? "Active — visible to others" : "Hidden"}
                  </span>
                </div>
                {duoProfile.preferredRoles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Playing: {duoProfile.preferredRoles.map(formatRole).join(", ")}
                  </p>
                )}
                {duoProfile.vibeTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {duoProfile.vibeTags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set up your duo profile to appear in search results
              </p>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Link href="/duo/setup">
              {duoProfile ? (
                <>
                  <Settings className="h-4 w-4" />
                  Edit
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Set Up
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Incoming requests */}
      <div className="rounded-2xl border border-border bg-card/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Incoming Requests</h2>
          {incoming.length > 0 && (
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {incoming.length}
            </span>
          )}
        </div>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((req) => (
              <IncomingRequestRow key={req.id} requestId={req.id} senderId={req.senderId} message={req.message} score={req.compatibilityScore} />
            ))}
          </div>
        )}
      </div>

      {/* Accepted partners */}
      {accepted.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-green-400" />
            <h2 className="font-semibold">Duo Partners</h2>
          </div>
          <div className="space-y-2">
            {accepted.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-sm font-medium">{req.receiverId.slice(0, 8)}…</p>
                <span className="text-xs text-green-400 font-medium">Connected</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing pending */}
      {pendingOutgoing.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/80 p-6">
          <h2 className="font-semibold mb-3">Sent Requests</h2>
          <div className="space-y-2">
            {pendingOutgoing.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                <p className="text-sm text-muted-foreground">{req.receiverId.slice(0, 8)}…</p>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IncomingRequestRow({
  requestId,
  senderId,
  message,
  score,
}: {
  requestId: string
  senderId: string
  message: string | null
  score: number | null
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/40">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{senderId.slice(0, 8)}…</p>
        {message && <p className="text-xs text-muted-foreground truncate">{message}</p>}
        {score && <p className="text-xs text-primary">{score}% match</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <AcceptDeclineButtons requestId={requestId} />
      </div>
    </div>
  )
}

function AcceptDeclineButtons({ requestId }: { requestId: string }) {
  // These require client-side interaction — handled via client component
  return (
    <div className="flex gap-2">
      <Link href={`/duo/requests?action=accept&id=${requestId}`}>
        <Button size="sm" variant="outline" className="text-green-400 border-green-500/30 hover:bg-green-500/10">
          Accept
        </Button>
      </Link>
      <Link href={`/duo/requests?action=decline&id=${requestId}`}>
        <Button size="sm" variant="ghost" className="text-muted-foreground">
          Decline
        </Button>
      </Link>
    </div>
  )
}
