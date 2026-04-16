"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion"

const TERMINAL_LINES = [
  "> ANALYZING JUNGLE PATHING...",
  "> ENEMY TILT FACTOR DETECTED AT 84%...",
  "> RECOMMENDATION: AGGRESSIVE COUNTER-JUNGLE AT 12:45.",
]

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, target])

  return (
    <div ref={ref} className="text-2xl font-bold" style={{ fontFamily: "var(--font-headline, sans-serif)" }}>
      {display}{suffix}
    </div>
  )
}

function TerminalLines() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!inView) return
    setLines([])
    setCurrentLine(0)
    setCurrentChar(0)
    setDone(false)
  }, [inView])

  useEffect(() => {
    if (!inView || done) return
    if (currentLine >= TERMINAL_LINES.length) {
      setDone(true)
      return
    }

    const full = TERMINAL_LINES[currentLine]

    if (currentChar < full.length) {
      const t = setTimeout(() => {
        setLines(prev => {
          const next = [...prev]
          next[currentLine] = full.slice(0, currentChar + 1)
          return next
        })
        setCurrentChar(c => c + 1)
      }, 28)
      return () => clearTimeout(t)
    } else {
      // Pause between lines
      const t = setTimeout(() => {
        setCurrentLine(l => l + 1)
        setCurrentChar(0)
      }, 420)
      return () => clearTimeout(t)
    }
  }, [inView, currentLine, currentChar, done])

  return (
    <div
      ref={ref}
      className="p-4 text-xs leading-relaxed min-h-[72px]"
      style={{
        background: "rgba(164,230,255,0.04)",
        border: "1px solid rgba(164,230,255,0.18)",
        color: "#a4e6ff",
        fontFamily: "monospace",
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>
          {line}
          {i === currentLine && !done && (
            <span className="animate-pulse">▋</span>
          )}
        </div>
      ))}
      {/* Blinking cursor on last line when done */}
      {done && <span className="animate-pulse">▋</span>}
    </div>
  )
}

export function LiveMatchIntelligence() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <div
      ref={ref}
      className="p-8 rounded-xl relative"
      style={{
        background: "rgba(30,31,37,0.6)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(164,230,255,0.15)",
        border: "1px solid rgba(164,230,255,0.2)",
      }}
    >
      <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full pointer-events-none" style={{ background: "rgba(164,230,255,0.12)", filter: "blur(48px)" }} />

      <div className="flex justify-between items-center mb-8">
        <span className="text-sm font-bold uppercase tracking-tighter" style={{ color: "#a4e6ff", fontFamily: "var(--font-headline, sans-serif)" }}>
          Live Match Intelligence
        </span>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f87171" }} />
      </div>

      <div className="space-y-6">
        {/* Animated progress bar */}
        <div className="h-4 rounded-full overflow-hidden" style={{ background: "rgba(51,53,58,0.8)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #a4e6ff, #00d1ff)", boxShadow: "0 0 10px rgba(164,230,255,0.7)" }}
            initial={{ width: "0%" }}
            animate={inView ? { width: "72%" } : { width: "0%" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </div>

        {/* Stat counters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 text-center rounded" style={{ background: "rgba(17,19,24,0.5)", border: "1px solid rgba(60,73,78,0.3)" }}>
            <div className="text-xs uppercase mb-1" style={{ color: "#bbc9cf", fontFamily: "var(--font-headline, sans-serif)" }}>Win Probability</div>
            <div style={{ color: "#a4e6ff" }}>
              <CountUp target={64} suffix="%" />
            </div>
          </div>
          <div className="p-4 text-center rounded" style={{ background: "rgba(17,19,24,0.5)", border: "1px solid rgba(60,73,78,0.3)" }}>
            <div className="text-xs uppercase mb-1" style={{ color: "#bbc9cf", fontFamily: "var(--font-headline, sans-serif)" }}>Tilt Risk</div>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: "#f87171", fontFamily: "var(--font-headline, sans-serif)" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              LOW
            </motion.div>
          </div>
          <div className="p-4 text-center rounded" style={{ background: "rgba(17,19,24,0.5)", border: "1px solid rgba(60,73,78,0.3)" }}>
            <div className="text-xs uppercase mb-1" style={{ color: "#bbc9cf", fontFamily: "var(--font-headline, sans-serif)" }}>Duo Synergy</div>
            <motion.div
              className="text-2xl font-bold"
              style={{ color: "#ffd692", fontFamily: "var(--font-headline, sans-serif)" }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              MAX
            </motion.div>
          </div>
        </div>

        {/* Typewriter terminal */}
        <TerminalLines />
      </div>
    </div>
  )
}
