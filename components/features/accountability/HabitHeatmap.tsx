"use client"

import { cn } from "@/lib/utils"
import { format, eachDayOfInterval, subWeeks, startOfDay } from "date-fns"

interface DayData {
  date: string // ISO date string
  count: number // number of sessions on this day
}

interface HabitHeatmapProps {
  data: DayData[]
  weeks?: number
}

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

const INTENSITY_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40",
  1: "bg-primary/20",
  2: "bg-primary/40",
  3: "bg-primary/70",
  4: "bg-primary",
}

export function HabitHeatmap({ data, weeks = 12 }: HabitHeatmapProps) {
  const today = startOfDay(new Date())
  const startDate = subWeeks(today, weeks - 1)

  const allDays = eachDayOfInterval({ start: startDate, end: today })

  // Index data by date string
  const dataMap: Record<string, number> = {}
  data.forEach((d) => {
    dataMap[d.date.slice(0, 10)] = d.count
  })

  // Group by week (7-day chunks)
  const weekGroups: Date[][] = []
  let currentWeek: Date[] = []

  // Pad first week to start on Sunday
  const firstDayOfWeek = startDate.getDay() // 0=Sun
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(new Date(0)) // placeholder
  }

  allDays.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weekGroups.push(currentWeek)
      currentWeek = []
    }
  })
  if (currentWeek.length > 0) weekGroups.push(currentWeek)

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="h-4 text-xs text-muted-foreground" style={{ lineHeight: "1rem" }}>
              {d === "Mon" || d === "Wed" || d === "Fri" ? d : ""}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weekGroups.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                if (day.getTime() === 0) {
                  return <div key={di} className="w-4 h-4" />
                }
                const dateStr = format(day, "yyyy-MM-dd")
                const count = dataMap[dateStr] ?? 0
                const intensity = getIntensity(count)
                return (
                  <div
                    key={di}
                    className={cn(
                      "w-4 h-4 rounded-sm transition-colors",
                      INTENSITY_CLASS[intensity]
                    )}
                    title={`${dateStr}: ${count} session${count !== 1 ? "s" : ""}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", INTENSITY_CLASS[i])} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
