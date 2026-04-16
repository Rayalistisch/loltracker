"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Zap, Brain, Target, Shield, X, Check } from "lucide-react"
import { toast } from "sonner"
import { preGameCheckinSchema, type PreGameCheckinInput } from "@/lib/validators/session"
import { ROLES, SESSION_GOALS } from "@/lib/utils/lol-constants"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { label: "Mental State",   desc: "Assess your current readiness" },
  { label: "Goals & Roles",  desc: "Define your session plan"      },
  { label: "Stop Condition", desc: "Set your discipline boundary"  },
]

// ─── Status label maps ────────────────────────────────────────────────────────

const MENTAL_STATUS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Tilted",     desc: "Not optimal for ranked",   color: "#f87171" },
  2: { label: "Low Focus",  desc: "Consider warmup first",    color: "#fb923c" },
  3: { label: "Neutral",    desc: "Standard readiness",       color: "#fbbf24" },
  4: { label: "Sharp",      desc: "Good mental clarity",      color: "#34d399" },
  5: { label: "Locked In",  desc: "Peak performance state",   color: "#4cd6ff" },
}

const ENERGY_STATUS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Exhausted",   desc: "Rest is recommended",     color: "#f87171" },
  2: { label: "Tired",       desc: "Fatigue may affect aim",  color: "#fb923c" },
  3: { label: "Moderate",    desc: "Functional energy",       color: "#fbbf24" },
  4: { label: "Energized",   desc: "Good reaction time",      color: "#34d399" },
  5: { label: "High Energy", desc: "Optimal physical state",  color: "#4cd6ff" },
}

const TILT_STATUS: Record<number, { label: string; desc: string; color: string }> = {
  1: { label: "Zero Risk",   desc: "Full emotional control",  color: "#4cd6ff" },
  2: { label: "Minimal",     desc: "Slight awareness needed", color: "#34d399" },
  3: { label: "Moderate",    desc: "Monitor your reactions",  color: "#fbbf24" },
  4: { label: "High Risk",   desc: "Take breaks if needed",   color: "#fb923c" },
  5: { label: "Tilting Now", desc: "Avoid ranked queuing",    color: "#f87171" },
}

// ─── Rating card ──────────────────────────────────────────────────────────────

function RatingCard({
  title,
  icon,
  value,
  onChange,
  statusMap,
}: {
  title: string
  icon: React.ReactNode
  value: number
  onChange: (v: number) => void
  statusMap: Record<number, { label: string; desc: string; color: string }>
}) {
  const current = statusMap[value]

  return (
    <div
      className="flex flex-col gap-5 p-6 border transition-all duration-300"
      style={{
        background: "rgba(30,31,37,0.7)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(133,147,153,0.15)",
        borderLeft: "1px solid rgba(133,147,153,0.15)",
        borderRight: "1px solid rgba(133,147,153,0.06)",
        borderBottom: `1px solid ${current.color}20`,
        boxShadow: `inset 0 -1px 0 ${current.color}15`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span style={{ color: current.color }}>{icon}</span>
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>

      {/* Number buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => {
          const s = statusMap[n]
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="flex-1 h-11 border text-sm font-black transition-all duration-200"
              style={
                active
                  ? {
                      background: `${s.color}15`,
                      borderColor: s.color,
                      color: s.color,
                      boxShadow: `0 0 12px ${s.color}30`,
                    }
                  : {
                      background: "rgba(255,255,255,0.02)",
                      borderColor: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.22)",
                    }
              }
            >
              {n}
            </button>
          )
        })}
      </div>

      {/* Status */}
      <div>
        <p className="text-sm font-black uppercase tracking-wide" style={{ color: current.color }}>
          {current.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
          {current.desc}
        </p>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface PreGameCheckinFormProps {
  currentRank: string | null
  defaultRole: string
}

export function PreGameCheckinForm({ currentRank, defaultRole }: PreGameCheckinFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [championInput, setChampionInput] = useState("")

  const form = useForm<PreGameCheckinInput>({
    resolver: zodResolver(preGameCheckinSchema),
    defaultValues: {
      mentalState:   3,
      energyLevel:   3,
      tiltRisk:      2,
      goal:          "climb",
      plannedGames:  5,
      plannedRoles:  [defaultRole],
      championPool:  [],
      stopCondition: "",
    },
  })

  async function onSubmit(values: PreGameCheckinInput) {
    setLoading(true)
    try {
      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plannedGames: values.plannedGames, rankAtStart: currentRank }),
      })
      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) throw new Error(sessionData.error)

      const checkinRes = await fetch(`/api/session/${sessionData.data.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const checkinData = await checkinRes.json()
      if (!checkinRes.ok) throw new Error(checkinData.error)

      toast.success("Session started! Good luck.")
      router.push("/session/active")
      router.refresh()
    } catch {
      toast.error("Failed to start session. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const ACCENT = "#4cd6ff"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

        {/* ── Step indicator ──────────────────────────────────────────────── */}
        <div className="flex items-start">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300"
                  style={
                    i < step
                      ? { background: ACCENT, borderColor: ACCENT, color: "#001f28" }
                      : i === step
                      ? { background: "transparent", borderColor: ACCENT, color: ACCENT, boxShadow: `0 0 12px ${ACCENT}40` }
                      : { background: "transparent", borderColor: "rgba(133,147,153,0.25)", color: "rgba(133,147,153,0.35)" }
                  }
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <p
                  className="text-[8px] font-black uppercase tracking-widest text-center leading-tight"
                  style={{ color: i === step ? ACCENT : "rgba(133,147,153,0.4)" }}
                >
                  {s.label}
                </p>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-px mx-4 mb-5 transition-all duration-500"
                  style={{ background: i < step ? ACCENT : "rgba(133,147,153,0.18)" }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step content ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
          >

            {/* Step 0 — Mental State */}
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                    How are you feeling right now?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Calibrate your Tactical AI by assessing your current readiness level.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="mentalState"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RatingCard
                            title="Mental State"
                            icon={<Brain className="h-3.5 w-3.5" />}
                            value={field.value}
                            onChange={field.onChange}
                            statusMap={MENTAL_STATUS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="energyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RatingCard
                            title="Energy Level"
                            icon={<Zap className="h-3.5 w-3.5" />}
                            value={field.value}
                            onChange={field.onChange}
                            statusMap={ENERGY_STATUS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tiltRisk"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RatingCard
                            title="Tilt Risk"
                            icon={<Shield className="h-3.5 w-3.5" />}
                            value={field.value}
                            onChange={field.onChange}
                            statusMap={TILT_STATUS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 1 — Goals & Roles */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                    What&apos;s your plan?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Define your session goal, role, and champion pool.
                  </p>
                </div>

                {/* Goal */}
                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Session Goal
                      </p>
                      <FormControl>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {SESSION_GOALS.map(goal => {
                            const active = field.value === goal.value
                            return (
                              <button
                                key={goal.value}
                                type="button"
                                onClick={() => field.onChange(goal.value)}
                                className="h-11 border text-xs font-black tracking-wider uppercase transition-all duration-200"
                                style={
                                  active
                                    ? { background: `${ACCENT}12`, borderColor: ACCENT, color: ACCENT }
                                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                                }
                              >
                                {goal.label}
                              </button>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Planned games */}
                <FormField
                  control={form.control}
                  name="plannedGames"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Planned Games
                      </p>
                      <FormControl>
                        <div className="flex gap-2">
                          {[2, 3, 4, 5, 6, 8, 10].map(n => {
                            const active = field.value === n
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => field.onChange(n)}
                                className="flex-1 h-11 border text-sm font-black transition-all duration-200"
                                style={
                                  active
                                    ? { background: `${ACCENT}12`, borderColor: ACCENT, color: ACCENT, boxShadow: `0 0 10px ${ACCENT}25` }
                                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.22)" }
                                }
                              >
                                {n}
                              </button>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Roles */}
                <FormField
                  control={form.control}
                  name="plannedRoles"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Roles Today
                      </p>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.filter(r => r.value !== "FILL").map(role => {
                            const selected = field.value.includes(role.value)
                            return (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => {
                                  field.onChange(
                                    selected
                                      ? field.value.filter((v: string) => v !== role.value)
                                      : [...field.value, role.value]
                                  )
                                }}
                                className="flex items-center gap-2 px-4 h-10 border text-xs font-black uppercase tracking-wider transition-all duration-200"
                                style={
                                  selected
                                    ? { background: `${ACCENT}12`, borderColor: ACCENT, color: ACCENT }
                                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                                }
                              >
                                <span>{role.icon}</span>
                                {role.label}
                              </button>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Champion pool */}
                <FormField
                  control={form.control}
                  name="championPool"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Champion Pool <span className="normal-case font-normal tracking-normal text-muted-foreground/50">(optional)</span>
                      </p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type champion name and press Enter..."
                          value={championInput}
                          onChange={e => setChampionInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const champ = championInput.trim()
                              if (champ && !field.value.includes(champ)) {
                                field.onChange([...field.value, champ])
                                setChampionInput("")
                              }
                            }
                          }}
                          className="h-10 border text-xs"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            borderColor: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.8)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const champ = championInput.trim()
                            if (champ && !field.value.includes(champ)) {
                              field.onChange([...field.value, champ])
                              setChampionInput("")
                            }
                          }}
                          className="px-4 h-10 border text-xs font-black uppercase tracking-wider transition-all"
                          style={{ borderColor: `${ACCENT}40`, color: ACCENT, background: `${ACCENT}08` }}
                        >
                          Add
                        </button>
                      </div>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {field.value.map((champ: string) => (
                            <span
                              key={champ}
                              className="inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-black uppercase tracking-wide cursor-pointer transition-all"
                              style={{
                                background: `${ACCENT}10`,
                                borderColor: `${ACCENT}30`,
                                color: ACCENT,
                              }}
                              onClick={() => field.onChange(field.value.filter((c: string) => c !== champ))}
                            >
                              {champ}
                              <X className="h-2.5 w-2.5" />
                            </span>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2 — Stop condition */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
                    Set your stop condition
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Define when you&apos;ll stop playing. Players who follow their stop conditions have better discipline scores.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    "Stop after 2 losses in a row",
                    "Stop after 3 losses in a row",
                    "Stop if I drop in LP",
                    "Stop if I feel tilted",
                    "Play exactly planned games",
                  ].map(preset => {
                    const active = form.watch("stopCondition") === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => form.setValue("stopCondition", preset)}
                        className="w-full text-left px-5 h-12 border flex items-center transition-all duration-200"
                        style={
                          active
                            ? {
                                background: `${ACCENT}08`,
                                borderColor: ACCENT,
                                color: ACCENT,
                                borderLeft: `3px solid ${ACCENT}`,
                              }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                borderColor: "rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.45)",
                                borderLeft: "3px solid transparent",
                              }
                        }
                      >
                        <span className="text-xs font-black uppercase tracking-wider">{preset}</span>
                      </button>
                    )
                  })}
                </div>

                <FormField
                  control={form.control}
                  name="stopCondition"
                  render={({ field }) => (
                    <FormItem>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                        Or write your own
                      </p>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Stop after any game where I flame or disconnect"
                          className="resize-none text-xs"
                          rows={3}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between pt-6 border-t"
          style={{ borderColor: "rgba(133,147,153,0.12)" }}
        >
          <button
            type="button"
            onClick={() => setStep(s => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 border text-xs font-black uppercase tracking-widest transition-all disabled:opacity-20"
            style={{ borderColor: "rgba(133,147,153,0.25)", color: "rgba(255,255,255,0.5)" }}
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all hover:brightness-110"
              style={{
                background: ACCENT,
                color: "#001f28",
                boxShadow: `0 0 16px ${ACCENT}30`,
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                background: ACCENT,
                color: "#001f28",
                boxShadow: `0 0 16px ${ACCENT}30`,
              }}
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Zap className="h-3.5 w-3.5" />
              }
              Start Session
            </button>
          )}
        </div>

      </form>
    </Form>
  )
}
