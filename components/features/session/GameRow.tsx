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

// ─── Quality helpers ──────────────────────────────────────────────────────────

interface Q { label: string; color: string; pct: number }

function visionQ(v: number): Q {
  if (v >= 60) return { label: "Excellent", color: "#34d399", pct: Math.min(v / 80, 1) }
  if (v >= 40) return { label: "Good",      color: "#34d399", pct: v / 80 }
  if (v >= 20) return { label: "Average",   color: "#fb923c", pct: v / 80 }
  return              { label: "Poor",      color: "#f87171", pct: Math.max(v / 80, 0.05) }
}
function csQ(v: number): Q {
  if (v >= 8)  return { label: "Excellent", color: "#34d399", pct: Math.min(v / 10, 1) }
  if (v >= 6)  return { label: "Good",      color: "#34d399", pct: v / 10 }
  if (v >= 4)  return { label: "Average",   color: "#fb923c", pct: v / 10 }
  return               { label: "Poor",     color: "#f87171", pct: Math.max(v / 10, 0.05) }
}
function dmgQ(v: number): Q {
  if (v >= 25000) return { label: "Excellent", color: "#34d399", pct: Math.min(v / 35000, 1) }
  if (v >= 15000) return { label: "Good",      color: "#34d399", pct: v / 35000 }
  if (v >= 8000)  return { label: "Average",   color: "#fb923c", pct: v / 35000 }
  return                  { label: "Poor",     color: "#f87171", pct: Math.max(v / 35000, 0.05) }
}

// ─── Arc gauge ────────────────────────────────────────────────────────────────

function ArcGauge({ value, label, quality }: { value: string; label: string; quality: Q }) {
  const size = 96; const cx = 48; const cy = 48; const r = 34; const strokeW = 6
  const arcDeg = 240; const arcRad = (arcDeg * Math.PI) / 180
  const startAngle = Math.PI / 2 + (2 * Math.PI - arcRad) / 2
  const fn = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  const s = fn(startAngle); const e = fn(startAngle + arcRad); const f = fn(startAngle + quality.pct * arcRad)
  const bgPath   = `M ${s.x} ${s.y} A ${r} ${r} 0 ${arcDeg > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  const fillPath = quality.pct > 0 ? `M ${s.x} ${s.y} A ${r} ${r} 0 ${quality.pct * arcDeg > 180 ? 1 : 0} 1 ${f.x} ${f.y}` : null
  const gid = `g${label.replace(/\W/g,"")}`
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={quality.color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={quality.color} stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} strokeLinecap="round" />
          {fillPath && (
            <path d={fillPath} fill="none" stroke={`url(#${gid})`} strokeWidth={strokeW} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${quality.color}88)` }} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingBottom: 10 }}>
          <span className="text-lg font-black tabular-nums leading-none" style={{ color: quality.color }}>{value}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">{label}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className="text-[9px] font-bold" style={{ color: quality.color }}>{quality.label}</span>
        </div>
      </div>
    </div>
  )
}


// ─── Tip engine ───────────────────────────────────────────────────────────────

function getTip(game: Game, role: string | undefined): { text: string; priority: "high" | "normal" } | null {
  const r = (role ?? "").toUpperCase()
  const dur = game.duration ?? 0
  const cspm = game.cs != null && dur > 0 ? game.cs / (dur / 60) : null
  const deaths = game.deaths ?? 0; const kills = game.kills ?? 0; const assists = game.assists ?? 0
  const vs = game.vision_score ?? null; const cw = game.control_wards ?? null
  const wp = game.wards_placed ?? null; const hs = game.heal_shield ?? 0; const cc = game.cc_score ?? null

  if (r === "SUPPORT") {
    if (deaths >= 6)  return { text: "Te veel sterfgevallen — blijf achter je ADC.", priority: "high" }
    if (vs !== null && vs < 20) return { text: `Vision score ${vs} is te laag. Ward elke base — tri-bush, river, pixel brush.`, priority: "high" }
    if (cw !== null && cw < 2)  return { text: "Koop een control ward bij elke base (75 gold, permanent vision deny).", priority: "high" }
    if (wp !== null && wp < 10) return { text: `Slechts ${wp} wards geplaatst. Gebruik trinket op cooldown.`, priority: "high" }
    if (assists < 4 && kills < 3) return { text: "Zoek meer engage. Roam naar mid na het pushen van bot.", priority: "normal" }
    if (hs > 0 && hs < 3000)    return { text: "Lage heal/shield output. Positioneer dichter bij je carry.", priority: "normal" }
    if (cc !== null && cc < 10) return { text: "Weinig CC toegepast. Gebruik crowd control eerder in teamfights.", priority: "normal" }
    if (vs !== null && vs >= 50) return { text: `Goede vision score (${vs}). Blijf objectives warden voor spawn.`, priority: "normal" }
    return { text: "Ward river en tri-bush na elke base.", priority: "normal" }
  }
  if (r === "JUNGLE") {
    if (cspm !== null && cspm < 5) return { text: `${cspm.toFixed(1)} CS/min — clear kampen voor je gankt. Doel: 5+.`, priority: "high" }
    if (deaths >= 5) return { text: "Invade niet zonder vision. Track vijandelijke jungle via vroege kampen.", priority: "high" }
    return { text: "Stel timer in voor Dragon/Baron 30s voor spawn en rally je team.", priority: "normal" }
  }
  if (r === "MID") {
    if (cspm !== null && cspm < 6) return { text: `${cspm.toFixed(1)} CS/min — push wave eerst, dan roam. Doel: 7+.`, priority: "high" }
    if (deaths >= 5) return { text: "Sterven mid opent de hele map. Trade alleen met wave prio.", priority: "high" }
    return { text: "Push wave voor je roamt zodat je geen CS én pressure tegelijk verliest.", priority: "normal" }
  }
  if (r === "BOTTOM") {
    if (cspm !== null && cspm < 6) return { text: `${cspm.toFixed(1)} CS/min — positionering kost je farm. Doel: 8+.`, priority: "high" }
    if (deaths >= 6) return { text: "ADC deaths zijn kostbaar — blijf in de backline van teamfights.", priority: "high" }
    return { text: "Prioriteer CS boven kills early. Elke 15 CS gemist = item vertraging.", priority: "normal" }
  }
  if (r === "TOP") {
    if (cspm !== null && cspm < 6) return { text: `${cspm.toFixed(1)} CS/min — top is een farm lane. Doel: 7+.`, priority: "high" }
    if (deaths >= 5) return { text: "Gebruik Teleport defensief — bewaar het voor teamfights.", priority: "high" }
    return { text: "Na het winnen van lane, push en roteer met TP als macro tool.", priority: "normal" }
  }
  if (cspm !== null && cspm < 5) return { text: `${cspm.toFixed(1)} CS/min — CS verbeteren = snelste item voordeel.`, priority: "high" }
  if (deaths >= 7) return { text: "Focus op minder sterven — elke death = gold + map control voor vijand.", priority: "high" }
  return null
}

function fmt(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }

// ─── Champion icon ────────────────────────────────────────────────────────────

function ChampIcon({ name }: { name: string }) {
  const [err, setErr] = useState(false)
  if (err || !name) return (
    <div className="w-10 h-10 rounded border border-border/40 bg-muted/40 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
      {name?.[0] ?? "?"}
    </div>
  )
  return (
    <Image src={champIconUrl(name)} alt={name} width={40} height={40}
      className="w-10 h-10 rounded border border-border/20 object-cover shrink-0"
      onError={() => setErr(true)} unoptimized title={name} />
  )
}


// ─── Expanded stats ───────────────────────────────────────────────────────────

function ExpandedStats({ game, role }: { game: Game; role?: string }) {
  const r = (role ?? "").toUpperCase()
  const dur = game.duration ?? 0
  const cspm = game.cs != null && dur > 0 ? (game.cs / (dur / 60)) : null
  const gpm  = game.gold_earned && dur > 0 ? Math.round(game.gold_earned / (dur / 60)) : null
  const tip  = getTip(game, role)
  const isSupport = r === "SUPPORT"

  // Build gauge list dynamically based on role
  const gauges: { value: string; label: string; quality: Q }[] = []

  if (isSupport) {
    if (game.vision_score != null)
      gauges.push({ value: String(game.vision_score), label: "Vision", quality: visionQ(game.vision_score) })
    if (game.wards_placed != null) {
      const q: Q = game.wards_placed >= 15
        ? { label: "Excellent", color: "#34d399", pct: Math.min(game.wards_placed / 40, 1) }
        : game.wards_placed >= 10
        ? { label: "Good",      color: "#fb923c", pct: game.wards_placed / 40 }
        : { label: "Low",       color: "#f87171", pct: Math.max(game.wards_placed / 40, 0.05) }
      gauges.push({ value: String(game.wards_placed), label: "Wards", quality: q })
    }
    if (game.control_wards != null) {
      const q: Q = game.control_wards >= 3
        ? { label: "Great",    color: "#34d399", pct: Math.min(game.control_wards / 5, 1) }
        : game.control_wards >= 2
        ? { label: "Ok",       color: "#fb923c", pct: game.control_wards / 5 }
        : { label: "Buy more", color: "#f87171", pct: Math.max(game.control_wards / 5, 0.05) }
      gauges.push({ value: String(game.control_wards), label: "Control", quality: q })
    }
    if (game.cc_score != null && game.cc_score > 0) {
      const q: Q = game.cc_score >= 30
        ? { label: "High",    color: "#34d399", pct: Math.min(game.cc_score / 60, 1) }
        : game.cc_score >= 10
        ? { label: "Average", color: "#fb923c", pct: game.cc_score / 60 }
        : { label: "Low",     color: "#f87171", pct: Math.max(game.cc_score / 60, 0.05) }
      gauges.push({ value: `${game.cc_score}s`, label: "CC", quality: q })
    }
    if (game.heal_shield != null && game.heal_shield > 0) {
      const q: Q = game.heal_shield >= 5000
        ? { label: "Strong",  color: "#34d399", pct: Math.min(game.heal_shield / 15000, 1) }
        : game.heal_shield >= 3000
        ? { label: "Average", color: "#fb923c", pct: game.heal_shield / 15000 }
        : { label: "Low",     color: "#f87171", pct: Math.max(game.heal_shield / 15000, 0.05) }
      gauges.push({ value: fmt(game.heal_shield), label: "Heal+Shield", quality: q })
    }
    if (gpm != null) {
      const q: Q = gpm >= 350
        ? { label: "Strong",  color: "#fbbf24", pct: Math.min(gpm / 450, 1) }
        : { label: "Average", color: "#fbbf2488", pct: gpm / 450 }
      gauges.push({ value: String(gpm), label: "Gold/min", quality: q })
    }
  } else {
    if (cspm != null) {
      gauges.push({ value: cspm.toFixed(1), label: "CS/min", quality: csQ(cspm) })
    }
    if (game.damage_to_champs != null) {
      gauges.push({ value: fmt(game.damage_to_champs), label: "Damage", quality: dmgQ(game.damage_to_champs) })
    }
    if (game.vision_score != null) {
      gauges.push({ value: String(game.vision_score), label: "Vision", quality: visionQ(game.vision_score) })
    }
    if (gpm != null) {
      const q: Q = gpm >= 350
        ? { label: "Strong",  color: "#fbbf24", pct: Math.min(gpm / 450, 1) }
        : gpm >= 280
        ? { label: "Average", color: "#fb923c", pct: gpm / 450 }
        : { label: "Low",     color: "#f87171", pct: Math.max(gpm / 450, 0.05) }
      gauges.push({ value: String(gpm), label: "Gold/min", quality: q })
    }
    if (game.wards_placed != null) {
      const q: Q = { label: "Wards", color: "#818cf8", pct: Math.min(game.wards_placed / 40, 1) }
      gauges.push({ value: String(game.wards_placed), label: "Wards", quality: q })
    }
    if (game.control_wards != null) {
      const q: Q = game.control_wards >= 2
        ? { label: "Good", color: "#34d399", pct: Math.min(game.control_wards / 5, 1) }
        : { label: "Low",  color: "#fb923c", pct: Math.max(game.control_wards / 5, 0.05) }
      gauges.push({ value: String(game.control_wards), label: "Control", quality: q })
    }
  }

  return (
    <div
      className="px-5 pb-5 pt-5 border-t border-white/[0.05] space-y-4"
      style={{ background: "linear-gradient(180deg, rgba(14,15,20,0.8) 0%, rgba(10,11,15,0.95) 100%)" }}
    >
      {/* Arc gauges row */}
      {gauges.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {gauges.map((g, i) => (
            <ArcGauge key={i} value={g.value} label={g.label} quality={g.quality} />
          ))}
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div
          className="rounded-xl border p-4 flex items-start gap-3"
          style={{
            background: tip.priority === "high"
              ? "linear-gradient(135deg, rgba(251,146,60,0.08), rgba(20,21,26,0.9))"
              : "linear-gradient(135deg, rgba(76,214,255,0.06), rgba(20,21,26,0.9))",
            borderColor: tip.priority === "high" ? "rgba(251,146,60,0.2)" : "rgba(76,214,255,0.15)",
          }}
        >
          {tip.priority === "high"
            ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-orange-400" />
            : <Info className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1"
              style={{ color: tip.priority === "high" ? "#fb923c99" : "#4cd6ff99" }}>
              Tip{role ? ` · ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}` : ""}
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">{tip.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GameRow({ game, role }: { game: Game; role?: string }) {
  const [open, setOpen] = useState(false)

  const isWin  = game.result === "win"
  const dur    = game.duration ?? 0
  const kda    = game.kills != null && game.deaths != null && game.assists != null
    ? `${game.kills} / ${game.deaths} / ${game.assists}` : null
  const kdaNum = game.deaths != null && game.deaths > 0 && game.kills != null && game.assists != null
    ? (game.kills + game.assists) / game.deaths : null
  const kdaRatio = kdaNum != null ? kdaNum.toFixed(2) + " KDA"
    : game.deaths === 0 && game.kills != null ? "Perfect KDA" : null
  const cspm   = game.cs != null && dur > 0 ? (game.cs / (dur / 60)).toFixed(1) : null
  const dtime  = dur ? `${Math.floor(dur/60)}:${String(dur%60).padStart(2,"0")}` : null
  const accent = isWin ? "#4cd6ff" : "#f87171"

  const hasStats = game.vision_score != null || game.damage_to_champs != null
    || game.wards_placed != null || game.heal_shield != null || game.gold_earned != null

  return (
    <div>
      {/* ── Main row ──────────────────────────────────────────────────────────── */}
      <div
        className={cn("flex items-center gap-4 px-4 py-3 transition-colors", hasStats && "cursor-pointer hover:bg-white/[0.025]")}
        style={{ borderLeft: `3px solid ${accent}40` }}
        onClick={() => hasStats && setOpen(v => !v)}
      >
        {/* Champion + result */}
        <div className="flex items-center gap-3 w-44 shrink-0">
          {game.champion && <ChampIcon name={game.champion} />}
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight" style={{ color: accent }}>
              {isWin ? "Victory" : "Defeat"}
            </p>
            {game.champion && <p className="text-xs text-muted-foreground truncate">{game.champion}</p>}
          </div>
        </div>

        {/* KDA */}
        <div className="w-36 shrink-0">
          {kda ? (
            <>
              <p className="text-sm font-black tabular-nums text-foreground">{kda}</p>
              {kdaRatio && (
                <p className={cn("text-[11px] font-medium",
                  kdaRatio === "Perfect KDA" ? "text-yellow-400" :
                  kdaNum != null && kdaNum >= 4 ? "text-emerald-400" :
                  kdaNum != null && kdaNum < 2  ? "text-red-400" :
                  "text-muted-foreground"
                )}>{kdaRatio}</p>
              )}
            </>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </div>

        {/* CS */}
        <div className="w-20 shrink-0 hidden md:block">
          {game.cs != null ? (
            <>
              <p className="text-sm font-bold tabular-nums text-foreground">{game.cs}</p>
              {cspm && <p className="text-[11px] text-muted-foreground">{cspm}/min</p>}
            </>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </div>

        {/* Damage */}
        <div className="w-20 shrink-0 hidden md:block">
          {game.damage_to_champs != null ? (
            <>
              <p className="text-sm font-bold tabular-nums text-foreground">{fmt(game.damage_to_champs)}</p>
              <div className="mt-0.5 h-1 rounded-full bg-white/5 overflow-hidden w-16">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(game.damage_to_champs/35000,1)*100}%`,
                  background: dmgQ(game.damage_to_champs).color,
                }} />
              </div>
            </>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </div>

        {/* Vision */}
        <div className="w-16 shrink-0 hidden md:block">
          {game.vision_score != null ? (
            <p className="text-sm font-bold tabular-nums" style={{ color: visionQ(game.vision_score).color }}>
              {game.vision_score}
            </p>
          ) : <span className="text-muted-foreground text-sm">—</span>}
        </div>

        {/* Duration */}
        <div className="w-14 shrink-0 text-right">
          {dtime ? <p className="text-sm text-muted-foreground tabular-nums">{dtime}</p> : null}
        </div>

        {/* Expand */}
        {hasStats && (
          <div className="ml-auto text-muted-foreground/40 shrink-0">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}
      </div>

      {/* ── Expanded ──────────────────────────────────────────────────────────── */}
      {open && hasStats && <ExpandedStats game={game} role={role} />}
    </div>
  )
}
