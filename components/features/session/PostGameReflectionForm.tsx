"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  MessageSquare,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { postGameReflectionFormSchema, type PostGameReflectionFormInput } from "@/lib/validators/session"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PostGameReflectionFormProps {
  sessionId: string
  gamesWon: number
  gamesLost: number
  actualGames: number
  checkinMentalState: number
}

const STEPS = ["Results", "Reflection", "Rating"]

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

export function PostGameReflectionForm({
  sessionId,
  gamesWon,
  gamesLost,
  actualGames,
  checkinMentalState,
}: PostGameReflectionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const form = useForm<PostGameReflectionFormInput>({
    resolver: zodResolver(postGameReflectionFormSchema),
    defaultValues: {
      followedStopCondition: true,
      mentalStateEnd: 3,
      tiltMoments: 0,
      biggestMistake: "",
      whatWentWell: "",
      improvementFocus: "",
      wouldPlayAgain: null,
      overallRating: 3,
    },
  })

  async function onSubmit(values: PostGameReflectionFormInput) {
    setLoading(true)
    try {
      const res = await fetch(`/api/session/${sessionId}/reflect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          actualGames,
          gamesWon,
          gamesLost,
          checkinMentalState,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Session saved. Great work!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Failed to save reflection. Try again.")
    } finally {
      setLoading(false)
    }
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
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
            {/* Step 0: Results */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">How did the session go?</h2>
                </div>

                {/* W/L summary */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{gamesWon}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{gamesLost}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{actualGames}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="followedStopCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Did you follow your stop condition?</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[
                            { value: true, label: "Yes" },
                            { value: false, label: "No" },
                          ].map(({ value, label }) => (
                            <button
                              key={String(value)}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                "flex-1 h-10 rounded-lg border text-sm font-medium transition-all",
                                field.value === value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              {label}
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
                  name="tiltMoments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many times did you feel tilted?</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4, 5].map((n) => (
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
                              {n === 5 ? "5+" : n}
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
                  name="mentalStateEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mental state at end of session</FormLabel>
                      <FormControl>
                        <RatingRow
                          value={field.value}
                          onChange={field.onChange}
                          low="Tilted / exhausted"
                          high="Feeling great"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 1: Reflection */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Quick reflection</h2>
                </div>

                <FormField
                  control={form.control}
                  name="whatWentWell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What went well? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Good laning phase, roamed well..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biggestMistake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biggest mistake / tilt moment? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Kept chasing after falling behind..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="improvementFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One thing to improve next session? <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Warding river before objectives..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wouldPlayAgain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Would you play again right now?</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          {[
                            { value: true, label: "Yes" },
                            { value: false, label: "No, need a break" },
                          ].map(({ value, label }) => (
                            <button
                              key={String(value)}
                              type="button"
                              onClick={() => field.onChange(value)}
                              className={cn(
                                "flex-1 h-10 rounded-lg border text-sm font-medium transition-all",
                                field.value === value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Rating */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Rate your session</h2>
                </div>

                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall session quality</FormLabel>
                      <FormControl>
                        <RatingRow
                          value={field.value}
                          onChange={field.onChange}
                          low="Terrible session"
                          high="Peak performance"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Summary */}
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                  <p className="text-sm font-medium">Session summary</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Record</span>
                      <p className="font-semibold">
                        <span className="text-green-400">{gamesWon}W</span>
                        {" — "}
                        <span className="text-red-400">{gamesLost}L</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Win Rate</span>
                      <p className="font-semibold">
                        {actualGames > 0
                          ? `${Math.round((gamesWon / actualGames) * 100)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stop Condition</span>
                      <p className={cn(
                        "font-semibold",
                        form.watch("followedStopCondition") ? "text-green-400" : "text-red-400"
                      )}>
                        {form.watch("followedStopCondition") ? "Followed" : "Ignored"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tilt Moments</span>
                      <p className="font-semibold">{form.watch("tiltMoments")}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
              className="gap-1.5"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Session
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
