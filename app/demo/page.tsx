"use client"

import { useState } from "react"
import { PostGameRecap, type RecapGame, type RecapSessionStats } from "@/components/features/session/PostGameRecap"
import { AnimatePresence } from "framer-motion"

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS: {
  label:        string
  game:         RecapGame
  stats:        RecapSessionStats
  stopCondition: string | null
  role:         string
}[] = [
  {
    label: "Victory · Ahri MID · Good CS",
    role: "MID",
    stopCondition: "Stop after 3 losses in a row",
    game: {
      id: "1", result: "win",
      champion: "Ahri", kills: 8, deaths: 2, assists: 7,
      cs: 187, duration: 1680,
    },
    stats: { wins: 3, losses: 1, totalGames: 4, lossStreak: 0, winStreak: 3 },
  },
  {
    label: "Defeat · Jinx ADC · Low CS",
    role: "BOTTOM",
    stopCondition: "Stop after 3 losses in a row",
    game: {
      id: "2", result: "loss",
      champion: "Jinx", kills: 3, deaths: 9, assists: 4,
      cs: 112, duration: 1920,
    },
    stats: { wins: 1, losses: 2, totalGames: 3, lossStreak: 2, winStreak: 0 },
  },
  {
    label: "Defeat · Thresh SUP · Stop condition triggered",
    role: "SUPPORT",
    stopCondition: "Stop after 3 losses in a row",
    game: {
      id: "3", result: "loss",
      champion: "Thresh", kills: 1, deaths: 5, assists: 6,
      cs: 18, duration: 1560,
      visionScore: 38, wardsPlaced: 22, wardsKilled: 7,
      controlWardsPlaced: 4, totalHeal: 2100, totalShield: 5800, ccScore: 42,
    },
    stats: { wins: 1, losses: 3, totalGames: 4, lossStreak: 3, winStreak: 0 },
  },
  {
    label: "Victory · Lee Sin JGL · Low clear",
    role: "JUNGLE",
    stopCondition: null,
    game: {
      id: "4", result: "win",
      champion: "Lee Sin", kills: 6, deaths: 4, assists: 9,
      cs: 98, duration: 1980,
    },
    stats: { wins: 2, losses: 1, totalGames: 3, lossStreak: 0, winStreak: 1 },
  },
  {
    label: "Defeat · Darius TOP · Deaths",
    role: "TOP",
    stopCondition: "Stop after 2 hours",
    game: {
      id: "5", result: "loss",
      champion: "Darius", kills: 4, deaths: 8, assists: 3,
      cs: 145, duration: 2100,
    },
    stats: { wins: 2, losses: 2, totalGames: 4, lossStreak: 1, winStreak: 0 },
  },
  {
    label: "Victory · Ezreal ADC · 5 win streak",
    role: "BOTTOM",
    stopCondition: null,
    game: {
      id: "6", result: "win",
      champion: "Ezreal", kills: 12, deaths: 1, assists: 8,
      cs: 231, duration: 1740,
    },
    stats: { wins: 5, losses: 0, totalGames: 5, lossStreak: 0, winStreak: 5 },
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(true)
  const scenario = SCENARIOS[active]

  function pick(i: number) {
    setShown(false)
    setTimeout(() => { setActive(i); setShown(true) }, 150)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Preview</p>
          <h1 className="text-xl font-bold">Post-Game Recap</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verschijnt automatisch na elke gedetecteerde game tijdens een sessie
          </p>
        </div>

        {/* Scenario picker */}
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                active === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Recap component */}
        <AnimatePresence mode="wait">
          {shown && (
            <PostGameRecap
              key={active}
              game={scenario.game}
              sessionStats={scenario.stats}
              stopCondition={scenario.stopCondition}
              role={scenario.role}
              onContinue={() => alert("Continue → terug naar active session")}
              onEndSession={() => alert("End session → naar reflection")}
            />
          )}
        </AnimatePresence>

        {/* Context note */}
        <p className="text-xs text-muted-foreground text-center">
          De progressbalk telt 30 seconden af — daarna auto-dismiss naar de session tracker
        </p>
      </div>
    </div>
  )
}
