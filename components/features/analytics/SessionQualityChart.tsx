"use client"

import { formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils"
import type { PlayerSession } from "@/types/domain"

interface SessionQualityChartProps {
  sessions: PlayerSession[]
}

export function SessionQualityChart({ sessions }: SessionQualityChartProps) {
  // Show last 10 sessions with check-ins and reflections, reversed for chronological order
  const chartSessions = sessions
    .filter((s) => s.preCheckin && s.postReflection)
    .slice(0, 10)
    .reverse()

  if (chartSessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        No completed sessions with check-ins yet
      </div>
    )
  }

  const maxVal = 5
  const barWidth = 24
  const gap = 12
  const chartHeight = 120
  const totalWidth = chartSessions.length * (barWidth * 2 + gap + 8)

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
          Mental start
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" />
          Mental end
        </span>
      </div>

      {/* Bar chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalWidth, height: chartHeight + 48 }} className="relative">
          {/* Y-axis labels */}
          {[1, 2, 3, 4, 5].map((v) => (
            <div
              key={v}
              className="absolute text-xs text-muted-foreground"
              style={{
                top: chartHeight - (v / maxVal) * chartHeight - 8,
                left: 0,
                width: 16,
              }}
            >
              {v}
            </div>
          ))}

          {/* Gridlines */}
          <div className="absolute inset-0 pl-5">
            {[1, 2, 3, 4, 5].map((v) => (
              <div
                key={v}
                className="absolute w-full border-t border-border/20"
                style={{ top: chartHeight - (v / maxVal) * chartHeight }}
              />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-0 pl-5 flex items-end gap-2 pb-10">
            {chartSessions.map((session, i) => {
              const startVal = session.preCheckin!.mentalState
              const endVal = session.postReflection!.mentalStateEnd
              const startHeight = (startVal / maxVal) * chartHeight
              const endHeight = (endVal / maxVal) * chartHeight
              const improved = endVal >= startVal

              return (
                <div key={session.id} className="flex items-end gap-1 group">
                  {/* Start bar */}
                  <div
                    className="relative rounded-t-sm bg-primary/80 hover:bg-primary transition-colors"
                    style={{ width: barWidth, height: startHeight }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-primary whitespace-nowrap">
                      {startVal}
                    </div>
                  </div>
                  {/* End bar */}
                  <div
                    className={cn(
                      "relative rounded-t-sm transition-colors",
                      improved ? "bg-purple-500/80 hover:bg-purple-500" : "bg-orange-500/80 hover:bg-orange-500"
                    )}
                    style={{ width: barWidth, height: endHeight }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-purple-400 whitespace-nowrap">
                      {endVal}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-5 flex gap-2">
            {chartSessions.map((session) => (
              <div
                key={session.id}
                className="text-xs text-muted-foreground text-center"
                style={{ width: barWidth * 2 + 4 }}
              >
                {formatDate(session.createdAt).slice(0, 6)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
