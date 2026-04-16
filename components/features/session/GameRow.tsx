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

// ─── Quality ratings ──────────────────────────────────────────────────────────

interface Quality { label: string; color: string; glow: string; pct: number }

function visionQuality(v: number): Quality {
  if (v >= 60) return { label: "Excellent", color: "#34d399", glow: "rgba(52,211,153,0.4)", pct: Math.min(v / 80, 1) }
  if (v >= 40) return { label: "Good",      color: "#34d399", glow: "rgba(52,211,153,0.3)", pct: v / 80 }
  if (v >= 20) return { label: "Average",   color: "#fb923c", glow: "rgba(251,146,60,0.35)", pct: v / 80 }
  return              { label: "Poor",      color: "#f87171", glow: "rgba(248,113,113,0.4)", pct: Math.max(v / 80, 0.05) }
}

function csMinQuality(v: number): Quality {
  if (v >= 8)  return { label: "Excellent", color: "#34d399", glow: "rgba(52,211,153,0.4)",  pct: Math.min(v / 10, 1) }
  if (v >= 6)  return { label: "Good",      color: "#34d399", glow: "rgba(52,211,153,0.3)",  pct: v / 10 }
  if (v >= 4)  return { label: "Average",   color: "#fb923c", glow: "rgba(251,146,60,0.35)", pct: v / 10 }
  return               { label: "Poor",     color: "#f87171", glow: "rgba(248,113,113,0.4)", pct: Math.max(v / 10, 0.05) }
}

function damageQuality(v: number): Quality {
  if (v >= 25000) return { label: "Excellent", color: "#34d399", glow: "rgba(52,211,153,0.4)",  pct: Math.min(v / 35000, 1) }
  if (v >= 15000) return { label: "Good",      color: "#34d399", glow: "rgba(52,211,153,0.3)",  pct: v / 35000 }
  if (v >= 8000)  return { label: "Average",   color: "#fb923c", glow: "rgba(251,146,60,0.35)", pct: v / 35000 }
  return                  { label: "Poor",     color: "#f87171", glow: "rgba(248,113,113,0.4)", pct: Math.max(v / 35000, 0.05) }
}

// ─── Circular arc gauge ───────────────────────────────────────────────────────

function ArcGauge({ value, label, quality }: {
  value: string
  label: string
  quality: Quality
}) {
  const size       = 110
  const cx         = size / 2
  const cy         = size / 2
  const r          = 40
  const strokeW    = 7
  const arcDeg     = 240
  const arcRad     = (arcDeg * Math.PI) / 180
  const startAngle = Math.PI / 2 + (2 * Math.PI - arcRad) / 2
  const endAngle   = startAngle + arcRad
  const total      = 2 * Math.PI * r
  const arcLength  = (arcDeg / 360) * total
  const fillLength = quality.pct * arcLength

  function polarToXY(angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  const s = polarToXY(startAngle)
  const e = polarToXY(endAngle)
  const f = polarToXY(startAngle + quality.pct * arcRad)

  const bgPath   = `M ${s.x} ${s.y} A ${r} ${r} 0 ${arcDeg > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  const fillPath = quality.pct > 0
    ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${quality.pct * arcDeg > 180 ? 1 : 0} 1 ${f.x} ${f.y}`
    : null

  const gradId = `grad-${label.replace(/\s/g, "")}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={quality.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={quality.color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW} strokeLinecap="round" />
          {/* Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={strokeW}
              strokeLinecap="round"
              filter={`url(#glow-${gradId})`}
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 10 }}>
          <span className="text-xl font-black tabular-nums leading-none" style={{ color: quality.color }}>
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</span>
        </div>
        {/* Quality label at bottom of arc */}
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-[10px] font-semibold" style={{ color: quality.color }}>
            {quality.label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Stat bar row ─────────────────────────────────────────────────────────────

function StatBar({ label, value, pct, color }: {
  label: string
  value: string
  pct: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(pct * 100, 2)}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  )
}

// ─── Tip engine ───────────────────────────────────────────────────────────────

interface Tip { text: string; priority: "high" | "normal" }

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
  const ccScore     = game.cc_score ?? null
  const goldEarned  = game.gold_earned ?? null
  const goldPerMin  = goldEarned != null && duration > 0 ? goldEarned / (duration / 60) : null

  if (r === "SUPPORT") {
    if (deaths >= 6)         return { text: "Te veel sterfgevallen — blijf achter je ADC en laat hem engages initiëren.", priority: "high" }
    if (visionScore !== null && visionScore < 20) return { text: `Vision score ${visionScore} is te laag. Ward elke base — tri-bush, river, pixel brush.`, priority: "high" }
    if (ctrlWards !== null && ctrlWards < 2)      return { text: "Koop een control ward bij elke base. Ze kosten 75 gold en verwijderen vijandelijke vision permanent.", priority: "high" }
    if (wardsPlaced !== null && wardsPlaced < 10) return { text: `Slechts ${wardsPlaced} wards geplaatst. Gebruik ward trinket op cooldown.`, priority: "high" }
    if (assists < 4 && kills < 3)                 return { text: "Zoek meer engage mogelijkheden. Roam naar mid nadat je bot hebt gepusht.", priority: "normal" }
    if (healShield > 0 && healShield < 3000)      return { text: "Lage heal/shield output. Positioneer dichter bij je carry in teamfights.", priority: "normal" }
    if (ccScore !== null && ccScore < 10)         return { text: "Weinig CC toegepast. Gebruik crowd control eerder in teamfights.", priority: "normal" }
    if (visionScore !== null && visionScore >= 50) return { text: `Goede vision score (${visionScore}). Blijf objectives warden voor ze spawnen.`, priority: "normal" }
    return { text: "Ward river en tri-bush na elke base. Vision control wint games voor ze beginnen.", priority: "normal" }
  }
  if (r === "JUNGLE") {
    if (csPerMin !== null && csPerMin < 5) return { text: `${csPerMin.toFixed(1)} CS/min — clear volledige kampen voor je gankt. Doel: 5+ CS/min.`, priority: "high" }
    if (deaths >= 5)                       return { text: "Invade niet zonder vision. Track vijandelijke jungle door vroege kampen te observeren.", priority: "high" }
    if (goldPerMin !== null && goldPerMin < 280) return { text: `${goldPerMin.toFixed(0)} gold/min is laag. Prioriteer objectives en camps.`, priority: "normal" }
    return { text: "Stel een timer in voor Dragon/Baron 30s voor spawn en rally je team vroeg.", priority: "normal" }
  }
  if (r === "MID") {
    if (csPerMin !== null && csPerMin < 6) return { text: `${csPerMin.toFixed(1)} CS/min — push wave eerst, dan roam. Doel: 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)                       return { text: "Sterven in mid opent de hele map. Speel veiliger — trade alleen met prio.", priority: "high" }
    return { text: "Push de wave voor je roamt zodat je geen CS én pressure tegelijk verliest.", priority: "normal" }
  }
  if (r === "BOTTOM") {
    if (csPerMin !== null && csPerMin < 6) return { text: `${csPerMin.toFixed(1)} CS/min — positionering kost je farm. Doel: 8+ CS/min.`, priority: "high" }
    if (deaths >= 6)                       return { text: "ADC sterfgevallen zijn kostbaar — blijf in de achterhoede tijdens teamfights.", priority: "high" }
    return { text: "Prioriteer CS boven kills early. Elke 15 CS gemist = één item vertraging.", priority: "normal" }
  }
  if (r === "TOP") {
    if (csPerMin !== null && csPerMin < 6) return { text: `${csPerMin.toFixed(1)} CS/min — top lane is een CS farm lane. Doel: 7+ CS/min.`, priority: "high" }
    if (deaths >= 5)                       return { text: "Gebruik Teleport defensief — bewaar het voor teamfights.", priority: "high" }
    return { text: "Na het winnen van lane, push en roteer met TP. Jouw sidelane pressure is een macro tool.", priority: "normal" }
  }
  if (csPerMin !== null && csPerMin < 5) return { text: `${csPerMin.toFixed(1)} CS/min — CS verbeteren is de snelste manier om item voordeel te krijgen.`, priority: "high" }
  if (deaths >= 7)                       return { text: "Focus op minder sterven — elke dood geeft de vijand gold en map control.", priority: "high" }
  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

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
    <Image src={champIconUrl(name)} alt={name} width={36} height={36}
      className="w-9 h-9 rounded border border-border/30 object-cover shrink-0"
      onError={() => setError(true)} unoptimized title={name} />
  )
}

// ─── Expanded stats panels ────────────────────────────────────────────────────

function SupportStats({ game }: { game: Game }) {
  const duration = game.duration ?? 0
  const goldPerMin = game.gold_earned && duration > 0
    ? Math.round(game.gold_earned / (duration / 60)) : null

  const vs = game.vision_score ?? 0
  const q  = visionQuality(vs)

  return (
    <div className="space-y-4">
      {/* Hero gauge */}
      <div className="flex justify-center pt-1">
        <ArcGauge value={String(vs)} label="Vision" quality={q} />
      </div>

      {/* Stat bars */}
      <div className="space-y-2.5">
        {game.wards_placed != null && (
          <StatBar label="Wards geplaatst" value={String(game.wards_placed)}
            pct={Math.min(game.wards_placed / 40, 1)}
            color={game.wards_placed >= 15 ? "#34d399" : game.wards_placed >= 10 ? "#fb923c" : "#f87171"} />
        )}
        {game.control_wards != null && (
          <StatBar label="Control wards" value={String(game.control_wards)}
            pct={Math.min(game.control_wards / 8, 1)}
            color={game.control_wards >= 3 ? "#34d399" : game.control_wards >= 2 ? "#fb923c" : "#f87171"} />
        )}
        {game.wards_killed != null && (
          <StatBar label="Wards gecleared" value={String(game.wards_killed)}
            pct={Math.min(game.wards_killed / 15, 1)}
            color="#818cf8" />
        )}
        {game.heal_shield != null && game.heal_shield > 0 && (
          <StatBar label="Heal + Shield" value={fmt(game.heal_shield)}
            pct={Math.min(game.heal_shield / 15000, 1)}
            color={game.heal_shield >= 5000 ? "#34d399" : game.heal_shield >= 3000 ? "#fb923c" : "#f87171"} />
        )}
        {game.cc_score != null && game.cc_score > 0 && (
          <StatBar label="CC toegepast" value={`${game.cc_score}s`}
            pct={Math.min(game.cc_score / 60, 1)}
            color={game.cc_score >= 30 ? "#34d399" : game.cc_score >= 10 ? "#fb923c" : "#f87171"} />
        )}
        {goldPerMin != null && (
          <StatBar label="Gold / min" value={String(goldPerMin)}
            pct={Math.min(goldPerMin / 400, 1)}
            color="#fbbf24" />
        )}
      </div>
    </div>
  )
}

function CarryStats({ game, role }: { game: Game; role: string }) {
  const duration   = game.duration ?? 0
  const csPerMin   = game.cs != null && duration > 0 ? game.cs / (duration / 60) : null
  const goldPerMin = game.gold_earned && duration > 0
    ? Math.round(game.gold_earned / (duration / 60)) : null

  const isJungle = role === "JUNGLE"
  const heroVal  = csPerMin
  const heroQ    = heroVal != null ? csMinQuality(heroVal) : null

  return (
    <div className="space-y-4">
      {/* Hero gauge: CS/min */}
      {heroQ && heroVal != null && (
        <div className="flex justify-center pt-1">
          <ArcGauge value={heroVal.toFixed(1)} label="CS / min" quality={heroQ} />
        </div>
      )}

      {/* Stat bars */}
      <div className="space-y-2.5">
        {game.damage_to_champs != null && (() => {
          const dq = damageQuality(game.damage_to_champs)
          return (
            <StatBar label="Damage to champions" value={fmt(game.damage_to_champs)}
              pct={dq.pct} color={dq.color} />
          )
        })()}
        {goldPerMin != null && (
          <StatBar label="Gold / min" value={String(goldPerMin)}
            pct={Math.min(goldPerMin / 450, 1)}
            color={goldPerMin >= 350 ? "#34d399" : goldPerMin >= 280 ? "#fb923c" : "#f87171"} />
        )}
        {game.vision_score != null && (
          <StatBar label="Vision score" value={String(game.vision_score)}
            pct={Math.min(game.vision_score / 60, 1)}
            color="#818cf8" />
        )}
        {game.wards_placed != null && (
          <StatBar label="Wards geplaatst" value={String(game.wards_placed)}
            pct={Math.min(game.wards_placed / 20, 1)}
            color="#818cf8" />
        )}
        {game.control_wards != null && (
          <StatBar label="Control wards" value={String(game.control_wards)}
            pct={Math.min(game.control_wards / 6, 1)}
            color={game.control_wards >= 2 ? "#34d399" : "#fb923c"} />
        )}
      </div>
    </div>
  )
}

function GenericStats({ game }: { game: Game }) {
  const duration   = game.duration ?? 0
  const csPerMin   = game.cs != null && duration > 0 ? game.cs / (duration / 60) : null
  const goldPerMin = game.gold_earned && duration > 0
    ? Math.round(game.gold_earned / (duration / 60)) : null

  return (
    <div className="space-y-2.5">
      {csPerMin != null && (
        <StatBar label="CS / min" value={csPerMin.toFixed(1)}
          pct={Math.min(csPerMin / 10, 1)}
          color={csPerMin >= 7 ? "#34d399" : csPerMin >= 5 ? "#fb923c" : "#f87171"} />
      )}
      {goldPerMin != null && (
        <StatBar label="Gold / min" value={String(goldPerMin)}
          pct={Math.min(goldPerMin / 450, 1)} color="#fbbf24" />
      )}
      {game.damage_to_champs != null && (
        <StatBar label="Damage to champions" value={fmt(game.damage_to_champs)}
          pct={Math.min(game.damage_to_champs / 35000, 1)} color="#a78bfa" />
      )}
      {game.vision_score != null && (
        <StatBar label="Vision score" value={String(game.vision_score)}
          pct={Math.min(game.vision_score / 60, 1)} color="#818cf8" />
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GameRow({ game, role }: { game: Game; role?: string }) {
  const [open, setOpen] = useState(false)

  const isWin      = game.result === "win"
  const duration   = game.duration ?? 0
  const kda        = game.kills != null && game.deaths != null && game.assists != null
    ? `${game.kills} / ${game.deaths} / ${game.assists}` : null
  const kdaNum     = game.deaths != null && game.deaths > 0 && game.kills != null && game.assists != null
    ? (game.kills + game.assists) / game.deaths : null
  const kdaLabel   = kdaNum != null
    ? kdaNum.toFixed(2) + " KDA"
    : game.deaths === 0 && game.kills != null ? "Perfect KDA" : null
  const durationMin = duration
    ? `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}` : null
  const csPerMin   = game.cs != null && duration > 0
    ? (game.cs / (duration / 60)).toFixed(1) : null

  const r    = (role ?? "").toUpperCase()
  const tip  = getTip(game, role)
  const accent = isWin ? "oklch(0.60 0.20 258)" : "oklch(0.62 0.22 22)"

  const hasExpandedStats = game.vision_score != null || game.damage_to_champs != null
    || game.wards_placed != null || game.heal_shield != null || game.gold_earned != null

  return (
    <div
      className={cn("rounded-lg border overflow-hidden",
        isWin ? "border-[oklch(0.60_0.20_258/20%)]" : "border-[oklch(0.62_0.22_22/20%)]"
      )}
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {/* ── Collapsed row ─────────────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.025] transition-colors"
        style={{ background: isWin ? "oklch(0.60 0.20 258 / 7%)" : "oklch(0.62 0.22 22 / 7%)" }}
        onClick={() => hasExpandedStats && setOpen(v => !v)}
      >
        {game.champion && <ChampIcon name={game.champion} />}

        <div className="w-20 shrink-0">
          <p className={cn("text-xs font-bold", isWin ? "win-text" : "loss-text")}>
            {isWin ? "Victory" : "Defeat"}
          </p>
          {game.champion && <p className="text-[11px] text-muted-foreground truncate">{game.champion}</p>}
        </div>

        {kda && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold tabular-nums text-foreground">{kda}</p>
            {kdaLabel && (
              <p className={cn("text-[11px] font-medium",
                kdaLabel === "Perfect KDA"           ? "text-yellow-400" :
                kdaNum != null && kdaNum >= 4         ? "win-text" :
                kdaNum != null && kdaNum < 2          ? "loss-text" :
                                                        "text-muted-foreground"
              )}>{kdaLabel}</p>
            )}
          </div>
        )}

        {game.cs != null && (
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-foreground tabular-nums">{game.cs} CS</p>
            {csPerMin && <p className="text-[11px] text-muted-foreground">{csPerMin}/min</p>}
          </div>
        )}

        {durationMin && <p className="text-xs text-muted-foreground shrink-0 w-10 text-right">{durationMin}</p>}

        {hasExpandedStats && (
          <div className="ml-1 text-muted-foreground/50 shrink-0">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        )}
      </button>

      {/* ── Expanded ──────────────────────────────────────────────────────────── */}
      {open && hasExpandedStats && (
        <div
          className="px-4 pb-5 pt-4 border-t border-white/5"
          style={{ background: "linear-gradient(180deg, oklch(0.13 0 0 / 60%), oklch(0.10 0 0 / 80%))" }}
        >
          {r === "SUPPORT" && <SupportStats game={game} />}
          {["JUNGLE","MID","BOTTOM","TOP"].includes(r) && <CarryStats game={game} role={r} />}
          {!["SUPPORT","JUNGLE","MID","BOTTOM","TOP"].includes(r) && <GenericStats game={game} />}

          {/* Tip */}
          {tip && (
            <div className={cn(
              "mt-4 flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm",
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
