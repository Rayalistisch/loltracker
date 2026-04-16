"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ChevronRight, ChevronLeft, Zap, Brain, Target, Shield } from "lucide-react"
import { toast } from "sonner"
import { preGameCheckinSchema, type PreGameCheckinInput } from "@/lib/validators/session"
import { ROLES, SESSION_GOALS, POPULAR_CHAMPIONS } from "@/lib/utils/lol-constants"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PreGameCheckinFormProps {
  currentRank: string | null
  defaultRole: string
}

const STEPS = ["Mental State", "Goals & Roles", "Stop Condition"]

// ─── Rating buttons ────────────────────────────────────────────────────────────

function RatingRow({
  value,
  onChange,
  low,
  high,
}: {
  value: number
  onChange: (v: number) => void
  low: string
  high: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-10 rounded-lg border text-sm font-semibold transition-all",
              value === n
                ? "bg-primary border-primary text-primary-foreground"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function PreGameCheckinForm({ currentRank, defaultRole }: PreGameCheckinFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [championInput, setChampionInput] = useState("")

  const form = useForm<PreGameCheckinInput>({
    resolver: zodResolver(preGameCheckinSchema),
    defaultValues: {
      mentalState: 3,
      energyLevel: 3,
      tiltRisk: 2,
      goal: "climb",
      plannedGames: 5,
      plannedRoles: [defaultRole],
      championPool: [],
      stopCondition: "",
    },
  })

  async function onSubmit(values: PreGameCheckinInput) {
    setLoading(true)
    try {
      // Create session
      const sessionRes = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedGames: values.plannedGames,
          rankAtStart: currentRank,
        }),
      })
      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) throw new Error(sessionData.error)

      const sessionId = sessionData.data.id

      // Submit check-in
      const checkinRes = await fetch(`/api/session/${sessionId}/checkin`, {
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

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0))
  }

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn(
                "text-xs hidden sm:block transition-colors",
                i === step ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-px", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial="enter"
            animate="center"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Step 0: Mental State */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">How are you feeling right now?</h2>
                </div>

                <FormField
                  control={form.control}
                  name="mentalState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Mental State</FormLabel>
                      <FormControl>
                        <RatingRow
                          value={field.value}
                          onChange={field.onChange}
                          low="Tilted / stressed"
                          high="Locked in"
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
                      <FormLabel className="text-sm font-medium">Energy Level</FormLabel>
                      <FormControl>
                        <RatingRow
                          value={field.value}
                          onChange={field.onChange}
                          low="Exhausted"
                          high="High energy"
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
                      <FormLabel className="text-sm font-medium">Tilt Risk</FormLabel>
                      <FormControl>
                        <RatingRow
                          value={field.value}
                          onChange={field.onChange}
                          low="Calm, no risk"
                          high="Already tilting"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 1: Goals & Roles */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">What&apos;s your plan?</h2>
                </div>

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session goal</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {SESSION_GOALS.map((goal) => (
                            <button
                              key={goal.value}
                              type="button"
                              onClick={() => field.onChange(goal.value)}
                              className={cn(
                                "h-10 rounded-lg border text-sm font-medium transition-all",
                                field.value === goal.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                              )}
                            >
                              {goal.label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedGames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned games</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              className={cn(
                                "flex-1 h-10 rounded-lg border text-sm font-semibold transition-all",
                                field.value === n
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles today</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.filter((r) => r.value !== "FILL").map((role) => {
                            const selected = field.value.includes(role.value)
                            return (
                              <button
                                key={role.value}
                                type="button"
                                onClick={() => {
                                  if (selected) {
                                    field.onChange(field.value.filter((v: string) => v !== role.value))
                                  } else {
                                    field.onChange([...field.value, role.value])
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-all",
                                  selected
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border/50 text-muted-foreground hover:border-border"
                                )}
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

                <FormField
                  control={form.control}
                  name="championPool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Champions today <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type champion name..."
                          value={championInput}
                          onChange={(e) => setChampionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              const champ = championInput.trim()
                              if (champ && !field.value.includes(champ)) {
                                field.onChange([...field.value, champ])
                                setChampionInput("")
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const champ = championInput.trim()
                            if (champ && !field.value.includes(champ)) {
                              field.onChange([...field.value, champ])
                              setChampionInput("")
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {field.value.map((champ: string) => (
                            <span
                              key={champ}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                              onClick={() => field.onChange(field.value.filter((c: string) => c !== champ))}
                            >
                              {champ} ×
                            </span>
                          ))}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Stop condition */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Set your stop condition</h2>
                </div>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  Define when you&apos;ll stop playing. Players who follow their stop conditions have better discipline scores.
                </p>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {[
                    "Stop after 2 losses in a row",
                    "Stop after 3 losses in a row",
                    "Stop if I drop in LP",
                    "Stop if I feel tilted",
                    "Play exactly planned games",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => form.setValue("stopCondition", preset)}
                      className={cn(
                        "w-full text-left px-4 h-10 rounded-lg border text-sm transition-all",
                        form.watch("stopCondition") === preset
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="stopCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or write your own</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Stop after any game where I flame or disconnect"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={prevStep}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep} className="gap-1.5">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Zap className="h-4 w-4" />
              Start Session
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
