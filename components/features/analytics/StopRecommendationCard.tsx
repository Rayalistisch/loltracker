import { AlertTriangle, OctagonX, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StopRecommendation } from "@/types/domain"

interface StopRecommendationCardProps {
  recommendation: StopRecommendation
}

export function StopRecommendationCard({ recommendation }: StopRecommendationCardProps) {
  const config = {
    soft: {
      icon: Info,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      label: "Monitor",
    },
    firm: {
      icon: AlertTriangle,
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400",
      label: "Warning",
    },
    hard: {
      icon: OctagonX,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      label: "Stop Now",
    },
  }[recommendation.urgency]

  const Icon = config.icon

  return (
    <div className={cn("rounded-xl border p-4", config.bg, config.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.text)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold", config.text)}>{config.label}</span>
          </div>
          <p className="text-sm text-foreground">{recommendation.reason}</p>
          {recommendation.triggeringFactors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recommendation.triggeringFactors.map((factor) => (
                <span
                  key={factor}
                  className="text-xs px-2 py-0.5 rounded-full bg-border/40 text-muted-foreground"
                >
                  {factor}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
