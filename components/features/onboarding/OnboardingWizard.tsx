"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ChevronRight, ChevronLeft, User, Gamepad2, Target, Zap } from "lucide-react"
import { toast } from "sonner"
import { onboardingSchema, type OnboardingInput } from "@/lib/validators/profile"
import { ROLES, REGIONS } from "@/lib/utils/lol-constants"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const STEPS = ["Profile", "Riot Account", "Your Role", "You're set!"]

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      displayName: "",
      region: "EUW",
      mainRole: "FILL",
      secondaryRole: "",
      riotId: "",
      bio: "",
    },
  })

  async function checkUsername(value: string) {
    if (value.length < 3) return
    setCheckingUsername(true)
    try {
      const res = await fetch(`/api/profile/username-check?username=${encodeURIComponent(value)}`)
      const data = await res.json()
      setUsernameAvailable(data.available)
    } finally {
      setCheckingUsername(false)
    }
  }

  async function onSubmit(values: OnboardingInput) {
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          onboardingCompleted: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Welcome to Loltracker!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Failed to save profile. Try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleNext() {
    let fieldsToValidate: (keyof OnboardingInput)[] = []
    if (step === 0) fieldsToValidate = ["username", "displayName"]
    if (step === 1) fieldsToValidate = ["region"]
    if (step === 2) fieldsToValidate = ["mainRole"]

    const valid = await form.trigger(fieldsToValidate)
    if (!valid) return

    if (step === 0 && usernameAvailable === false) {
      form.setError("username", { message: "Username already taken" })
      return
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
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
            className="space-y-5"
          >
            {/* Step 0: Profile info */}
            {step === 0 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Set up your profile</h2>
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="your_name"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              setUsernameAvailable(null)
                            }}
                            onBlur={(e) => {
                              field.onBlur()
                              if (e.target.value.length >= 3) checkUsername(e.target.value)
                            }}
                          />
                          {usernameAvailable === true && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">
                              ✓ Available
                            </span>
                          )}
                          {usernameAvailable === false && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">
                              ✗ Taken
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bio <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell others about your playstyle..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 1: Riot account */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Your Riot account</h2>
                </div>
                <p className="text-sm text-muted-foreground -mt-2 mb-4">
                  Enter your Riot ID to link your LoL account. This is optional for now.
                </p>

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server / Region</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {REGIONS.map((region) => (
                            <button
                              key={region.value}
                              type="button"
                              onClick={() => field.onChange(region.value)}
                              className={cn(
                                "h-10 rounded-lg border text-sm font-medium transition-all",
                                field.value === region.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              {region.value}
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
                  name="riotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Riot ID <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="GameName#TAG" {...field} />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Format: Name#EUW1 — enables future match history sync
                      </p>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 2: Role */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">What do you play?</h2>
                </div>

                <FormField
                  control={form.control}
                  name="mainRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Main role</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.map((role) => (
                            <button
                              key={role.value}
                              type="button"
                              onClick={() => field.onChange(role.value)}
                              className={cn(
                                "flex items-center gap-1.5 px-4 h-10 rounded-lg border text-sm font-medium transition-all",
                                field.value === role.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              <span>{role.icon}</span>
                              {role.label}
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
                  name="secondaryRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Secondary role <span className="text-muted-foreground font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.map((role) => (
                            <button
                              key={role.value}
                              type="button"
                              onClick={() => field.onChange(field.value === role.value ? "" : role.value)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-all",
                                field.value === role.value
                                  ? "bg-primary/10 border-primary text-primary"
                                  : "border-border/50 text-muted-foreground hover:border-border"
                              )}
                            >
                              <span>{role.icon}</span>
                              {role.label}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Your profile is ready. Start your first session to begin tracking your habits.
                </p>
                <div className="mt-4 space-y-2 text-left rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recommended next steps
                  </p>
                  <p className="text-sm">1. Start a pre-game check-in before your first session</p>
                  <p className="text-sm">2. Track your games and stop condition</p>
                  <p className="text-sm">3. Fill in a post-game reflection to unlock analytics</p>
                </div>
              </div>
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
            <Button type="button" onClick={handleNext} className="gap-1.5" disabled={checkingUsername}>
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
