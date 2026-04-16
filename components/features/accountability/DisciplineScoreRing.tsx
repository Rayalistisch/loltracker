"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DisciplineMetrics } from "@/types/domain"

interface DisciplineScoreRingProps {
  metrics: DisciplineMetrics
  size?: "sm" | "md" | "lg"
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#3b82f6"
  if (score >= 40) return "#eab308"
  return "#ef4444"
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Good"
  if (score >= 40) return "Fair"
  return "Needs Work"
}

export function DisciplineScoreRing({ metrics, size = "md" }: DisciplineScoreRingProps) {
  const score = metrics.score
  const color = getScoreColor(score)

  const sizeMap = {
    sm: { r: 36, stroke: 6, fontSize: "text-2xl" },
    md: { r: 54, stroke: 8, fontSize: "text-4xl" },
    lg: { r: 70, stroke: 10, fontSize: "text-5xl" },
  }
  const { r, stroke, fontSize } = sizeMap[size]

  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - score / 100)
  const svgSize = (r + stroke) * 2 + 8

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={r}
            fill="none"
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums", fontSize)} style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">score</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{getScoreLabel(score)}</span>

      {/* Breakdown bars */}
      <div className="w-full space-y-2 mt-1">
        <BreakdownBar label="Check-ins" value={metrics.checkinRate} weight={35} />
        <BreakdownBar label="Stop adherence" value={metrics.stopAdherence} weight={35} />
        <BreakdownBar label="Reflection" value={metrics.reflectionQuality} weight={20} />
        <BreakdownBar label="Streak" value={metrics.streakBonus} weight={10} />
      </div>
    </div>
  )
}

function BreakdownBar({
  label,
  value,
  weight,
}: {
  label: string
  value: number
  weight: number
}) {
  const pct = Math.round(value * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
