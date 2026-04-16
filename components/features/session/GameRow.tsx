"use client"

import Image from "next/image"
import { useState } from "react"
import { champIconUrl } from "@/lib/utils/ddragon"
import { cn } from "@/lib/utils"
import { AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react"

interface Game {
  id: string
  result: "win" | "loss"
  champion: string | null
  kills: number | null
  deaths: number | null
  assists: number | null
  cs: number | null
  duration: number | null
  vision_score: number | null
  wards_placed: number | null
  wards_killed: number | null
  control_wards: number | null
  cc_score: number | null
  damage_to_champs: number | null
  heal_shield: number | null
  gold_earned: number | null
  played_at: string | null
}

// ─── Tip engine (zelfde logica als PostGameRecap) ────────────────────────────

interface Tip {
  text:     string
  priority: "high" | "normal"
}

function getTip(game: Game, role: string | undefined): Tip | null {
  const r           = (role ?? "").toUpperCase()
  const duration    = game.duration ?? 0
  const csPerMin    = game.cs != null && duration > 0 ? game.cs / (duration / 60) : null
  const deaths      = game.deaths ?? 0
  const kills       = game.kills ?? 0
  const assists     = game.assists ?? 0
  const visionScore = game.vision_score ?? null
  const ctrlWards   = game.control_wards ?? null
  const wardsPlaced = game.wards_placed ?? null
  const healShield  = game.heal_shield ?? 0
  const dmg         = game.damage_to_champs ?? null
  const ccScore     = game.cc_score ?? null
  const goldEarned  = game.gold_earned ?? null
  const goldPerMin  = goldEarned != null && duration > 0 ? goldEarned / (duration / 60) : null

  if (r === "SUPPORT") {
    if (deaths >= 6)
      return { text: "Te veel sterfgevallen — blijf achter je ADC en laat hem engages initiëren.", priority: "high" }
    if (visionScore !== null && visionScore < 20)
      return { text: `Vision score ${visionScore} is te laag. Ward elke base — tri-bush, river, pixel brush.`, priority: "high" }
    if (ctrlWards !== null && ctrlWards < 2)
      return { text: "Koop een control ward bij elke base. Ze kosten 75 gold en verwijderen vijandelijke vision permanent.", priority: "high" }
    if (wardsPlaced !== null && wardsPlaced < 10)
      return { text: `Slechts ${wardsPlaced} wards geplaatst. Gebruik ward trinket op cooldown.`, priority: "high" }
    if (assists < 4 && kills < 3)
      return { text: "Zoek meer engage mogelijkheden. Roam naar mid nadat je bot hebt gepusht.", priority: "normal" }
    if (healShield > 0 && healShield < 3000)
      return { text: "Lage heal/shield output. Positioneer dichter bij je carry in teamfights.", priority: "normal" }
    if (ccScore !== null && ccScore < 10)
      return { text: "Weinig CC toegepast. Gebruik crowd control eerder in teamfights om carries te stoppen.", priority: "normal" }
    if (visionScore !== null && visionScore >= 50)
      return { text: `Goede vision score (${visionScore}). Blijf objectives warden voor ze spawnen.`, priority: "normal" }
    return { text: "Ward river en tri-bush na elke base. Vision control wint games voor ze beginnen.", priority: "normal" }
  }

  if (r === "JUNGLE") {
    if (csPerMin !== null && csPerMin < 5)
      return { text: `${csPerMin.toFixed(1)} CS/min — clear volledige kampen voor je gankt. Doel: 5+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { text: "Invade niet zonder vision. Track vijandelijke jungle door vroege kampen te observeren.", priority: "high" }
    if (goldPerMin !== null && goldPerMin < 280)
      return { text: `${goldPerMin.toFixed(0)} gold/min is laag voor Jungle. Prioriteer objectives en camps boven onnodige ganks.`, priority: "normal" }
    return { text: "Stel een timer in voor Dragon/Baron 30s voor spawn en rally je team vroeg.", priority: "normal" }
  }

  if (r === "MID") {
    if (csPerMin !== null && csPerMin < 6)
      return { text: `${csPerMin.toFixed(1)} CS/min — push wave eerst, dan roam. Doel: 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { text: "Sterven in mid opent de hele map. Speel veiliger — trade alleen met prio.", priority: "high" }
    if (dmg !== null && dmg < 8000 && duration > 1200)
      return { text: "Lage damage output. Zoek meer kill pressure op in sidelanes na wave clear.", priority: "normal" }
    return { text: "Push de wave voor je roamt zodat je geen CS én pressure tegelijk verliest.", priority: "normal" }
  }

  if (r === "BOTTOM") {
    if (csPerMin !== null && csPerMin < 6)
      return { text: `${csPerMin.toFixed(1)} CS/min — positionering in lane kost je farm. Doel: 8+ CS/min.`, priority: "high" }
    if (deaths >= 6)
      return { text: "ADC sterfgevallen zijn kostbaar — blijf in de achterhoede tijdens teamfights.", priority: "high" }
    if (goldPerMin !== null && goldPerMin < 320)
      return { text: `${goldPerMin.toFixed(0)} gold/min. Focus meer op farm en objectief CS voor stabielere income.`, priority: "normal" }
    return { text: "Prioriteer CS boven kills early. Elke 15 CS gemist = één item vertraging.", priority: "normal" }
  }

  if (r === "TOP") {
    if (csPerMin !== null && csPerMin < 6)
      return { text: `${csPerMin.toFixed(1)} CS/min — top lane is een CS farm lane. Doel: 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)
      return { text: "Gebruik Teleport defensief — bewaar het voor teamfights in plaats van agressieve flanks.", priority: "high" }
    return { text: "Na het winnen van lane, push en roteer met TP. Jouw sidelane pressure is een macro tool.", priority: "normal" }
  }

  // Geen rol — generieke tips
  if (csPerMin !== null && csPerMin < 5)
    return { text: `${csPerMin.toFixed(1)} CS/min — CS verbeteren is de snelste manier om item voordeel te krijgen.`, priority: "high" }
  if (deaths >= 7)
    return { text: "Focus op minder sterven — elke dood geeft de vijand gold en map control.", priority: "high" }
  return null
}

// ─── Stat helpers ─────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function StatCell({ label, value, highlight, warn }: {
  label: string
  value: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className={cn(
      "rounded border px-2 py-1.5 text-center",
      highlight ? "border-emerald-500/25 bg-emerald-500/8" :
      warn      ? "border-orange-500/25 bg-orange-500/8" :
                  "border-border/30 bg-muted/20"
    )}>
      <div className={cn(
        "text-sm font-bold tabular-nums",
        highlight ? "text-emerald-300" :
        warn      ? "text-orange-300" :
                    "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  )
}

// ─── Champion icon ────────────────────────────────────────────────────────────

function ChampIcon({ name }: { name: string }) {
  const [error, setError] = useState(false)
  if (error || !name) {
    return (
      <div className="w-9 h-9 rounded border border-border/40 bg-muted/40 flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
        {name?.[0] ?? "?"}
      </div>
    )
  }
  return (
    <Image
      src={champIconUrl(name)}
      alt={name}
      width={36}
      height={36}
      className="w-9 h-9 rounded border border-border/30 object-cover shrink-0"
      onError={() => setError(true)}
      unoptimized
      title={name}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GameRow({ game, role }: { game: Game; role?: string }) {
  const [open, setOpen] = useState(false)

  const isWin    = game.result === "win"
  const duration = game.duration ?? 0
  const kda      = game.kills != null && game.deaths != null && game.assists != null
    ? `${game.kills} / ${game.deaths} / ${game.assists}`
    : null
  const kdaNum   = game.deaths != null && game.deaths > 0 && game.kills != null && game.assists != null
    ? ((game.kills + game.assists) / game.deaths)
    : null
  const kdaLabel = kdaNum != null
    ? kdaNum.toFixed(2) + " KDA"
    : game.deaths === 0 && game.kills != null
    ? "Perfect KDA"
    : null
  const durationMin = duration
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`
    : null
  const csPerMin = game.cs != null && duration > 0
    ? (game.cs / (duration / 60)).toFixed(1)
    : null
  const goldPerMin = game.gold_earned != null && duration > 0
    ? Math.round(game.gold_earned / (duration / 60))
    : null

  const tip = getTip(game, role)
  const r   = (role ?? "").toUpperCase()

  const accentColor = isWin ? "oklch(0.60 0.20 258)" : "oklch(0.62 0.22 22)"

  return (
    <div
      className={cn(
        "rounded border overflow-hidden",
        isWin ? "border-[oklch(0.60_0.20_258/25%)]" : "border-[oklch(0.62_0.22_22/25%)]"
      )}
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* ── Collapsed row ───────────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
        style={{ background: isWin ? "oklch(0.60 0.20 258 / 8%)" : "oklch(0.62 0.22 22 / 8%)" }}
        onClick={() => setOpen((v) => !v)}
      >
        {game.champion && <ChampIcon name={game.champion} />}

        {/* Result + champion */}
        <div className="w-20 shrink-0">
          <p className={cn("text-xs font-bold", isWin ? "win-text" : "loss-text")}>
            {isWin ? "Victory" : "Defeat"}
          </p>
          {game.champion && (
            <p className="text-[11px] text-muted-foreground truncate">{game.champion}</p>
          )}
        </div>

        {/* KDA */}
        {kda && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tabular-nums text-foreground">{kda}</p>
            {kdaLabel && (
              <p className={cn(
                "text-[11px] font-medium",
                kdaLabel === "Perfect KDA"             ? "text-yellow-400" :
                kdaNum != null && kdaNum >= 4           ? "win-text" :
                kdaNum != null && kdaNum < 2            ? "loss-text" :
                                                          "text-muted-foreground"
              )}>
                {kdaLabel}
              </p>
            )}
          </div>
        )}

        {/* CS */}
        {game.cs != null && (
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-foreground tabular-nums">{game.cs} CS</p>
            {csPerMin && <p className="text-[11px] text-muted-foreground">{csPerMin}/min</p>}
          </div>
        )}

        {/* Duration */}
        {durationMin && (
          <p className="text-xs text-muted-foreground shrink-0 w-10 text-right">{durationMin}</p>
        )}

        {/* Expand toggle */}
        <div className="ml-1 text-muted-foreground shrink-0">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* ── Expanded details ─────────────────────────────────────────────────── */}
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border/20 space-y-3">

          {/* Role-specific stats grid */}
          {r === "SUPPORT" && (
            <div className="grid grid-cols-3 gap-1.5">
              {game.vision_score != null && (
                <StatCell label="Vision" value={String(game.vision_score)}
                  highlight={game.vision_score >= 40} warn={game.vision_score < 20} />
              )}
              {game.wards_placed != null && (
                <StatCell label="Wards" value={String(game.wards_placed)}
                  highlight={game.wards_placed >= 15} warn={game.wards_placed < 10} />
              )}
              {game.control_wards != null && (
                <StatCell label="Control" value={String(game.control_wards)}
                  highlight={game.control_wards >= 3} warn={game.control_wards < 2} />
              )}
              {game.wards_killed != null && (
                <StatCell label="Cleared" value={String(game.wards_killed)} />
              )}
              {game.heal_shield != null && game.heal_shield > 0 && (
                <StatCell label="Heal+Shield" value={fmt(game.heal_shield)}
                  highlight={game.heal_shield >= 5000} warn={game.heal_shield < 3000} />
              )}
              {game.cc_score != null && game.cc_score > 0 && (
                <StatCell label="CC Tijd" value={`${game.cc_score}s`}
                  highlight={game.cc_score >= 30} warn={game.cc_score < 10} />
              )}
              {goldPerMin != null && (
                <StatCell label="Gold/min" value={String(goldPerMin)} />
              )}
            </div>
          )}

          {(r === "JUNGLE" || r === "MID" || r === "BOTTOM" || r === "TOP") && (
            <div className="grid grid-cols-3 gap-1.5">
              {csPerMin && (
                <StatCell label="CS/min" value={csPerMin}
                  highlight={parseFloat(csPerMin) >= 7}
                  warn={parseFloat(csPerMin) < 5} />
              )}
              {goldPerMin != null && (
                <StatCell label="Gold/min" value={String(goldPerMin)}
                  highlight={goldPerMin >= 350}
                  warn={goldPerMin < 280} />
              )}
              {game.damage_to_champs != null && (
                <StatCell label="Damage" value={fmt(game.damage_to_champs)}
                  highlight={game.damage_to_champs >= 15000} />
              )}
              {game.vision_score != null && (
                <StatCell label="Vision" value={String(game.vision_score)} />
              )}
              {game.wards_placed != null && (
                <StatCell label="Wards" value={String(game.wards_placed)} />
              )}
              {game.control_wards != null && (
                <StatCell label="Control" value={String(game.control_wards)} />
              )}
            </div>
          )}

          {/* Fallback als geen rol bekend */}
          {!["SUPPORT","JUNGLE","MID","BOTTOM","TOP"].includes(r) && (
            <div className="grid grid-cols-3 gap-1.5">
              {csPerMin && <StatCell label="CS/min" value={csPerMin} />}
              {goldPerMin != null && <StatCell label="Gold/min" value={String(goldPerMin)} />}
              {game.damage_to_champs != null && <StatCell label="Damage" value={fmt(game.damage_to_champs)} />}
              {game.vision_score != null && <StatCell label="Vision" value={String(game.vision_score)} />}
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div className={cn(
              "flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm",
              tip.priority === "high"
                ? "bg-orange-500/8 border-orange-500/20 text-orange-200"
                : "bg-primary/8 border-primary/20 text-blue-200"
            )}>
              {tip.priority === "high"
                ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-orange-400" />
                : <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
              }
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-0.5">
                  Tip{role ? ` · ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}` : ""}
                </p>
                <p className="leading-snug">{tip.text}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
