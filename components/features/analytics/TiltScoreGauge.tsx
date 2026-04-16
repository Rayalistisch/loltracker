"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { TiltStatus } from "@/types/enums"

interface TiltScoreGaugeProps {
  score: number
  status: TiltStatus
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const STATUS_CONFIG: Record<TiltStatus, { label: string; color: string; bgColor: string }> = {
  "locked-in":         { label: "Locked In",         color: "#22c55e", bgColor: "bg-green-500/10"  },
  "stable":            { label: "Stable",             color: "#3b82f6", bgColor: "bg-blue-500/10"   },
  "slipping":          { label: "Slipping",           color: "#eab308", bgColor: "bg-yellow-500/10" },
  "tilted":            { label: "Tilted",             color: "#f97316", bgColor: "bg-orange-500/10" },
  "stop-recommended":  { label: "Stop Recommended",  color: "#ef4444", bgColor: "bg-red-500/10"    },
}

export function TiltScoreGauge({
  score,
  status,
  size = "md",
  showLabel = true,
}: TiltScoreGaugeProps) {
  const config = STATUS_CONFIG[status]
  const clampedScore = Math.max(0, Math.min(100, score))

  const sizeMap = {
    sm: { r: 36, stroke: 6, fontSize: "text-xl", labelSize: "text-xs" },
    md: { r: 54, stroke: 8, fontSize: "text-3xl", labelSize: "text-sm" },
    lg: { r: 72, stroke: 10, fontSize: "text-4xl", labelSize: "text-base" },
  }
  const { r, stroke, fontSize, labelSize } = sizeMap[size]

  const circumference = 2 * Math.PI * r
  // Only use 75% of the circle (270 degrees) for the gauge arc
  const arcLength = circumference * 0.75
  const filled = arcLength * (clampedScore / 100)
  const dashOffset = arcLength - filled

  const svgSize = (r + stroke) * 2 + 8
  const cx = svgSize / 2
  const cy = svgSize / 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          style={{ transform: "rotate(135deg)" }}
        >
          {/* Background arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength + 1}`}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={config.color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength + 1}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "none" }}
        >
          <span className={cn("font-bold tabular-nums", fontSize)} style={{ color: config.color }}>
            {clampedScore}
          </span>
          {showLabel && (
            <span className={cn("text-muted-foreground", labelSize)}>tilt</span>
          )}
        </div>
      </div>
      {showLabel && (
        <span className={cn(
          "text-sm font-semibold px-2.5 py-0.5 rounded-full",
          config.bgColor
        )} style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  )
}
