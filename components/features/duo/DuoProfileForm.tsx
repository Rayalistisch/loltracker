"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { duoProfileSchema, type DuoProfileInput } from "@/lib/validators/duo"
import { ROLES, COMMUNICATION_STYLES, VIBE_TAGS, LANGUAGES } from "@/lib/utils/lol-constants"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { DuoProfile } from "@/types/domain"

interface DuoProfileFormProps {
  existing?: DuoProfile | null
}

export function DuoProfileForm({ existing }: DuoProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<DuoProfileInput>({
    resolver: zodResolver(duoProfileSchema),
    defaultValues: {
      isActive: existing?.isActive ?? true,
      preferredRoles: existing?.preferredRoles ?? [],
      preferredPartnerRoles: existing?.preferredPartnerRoles ?? [],
      communicationStyle: existing?.communicationStyle ?? [],
      vibeTags: existing?.vibeTags ?? [],
      languages: existing?.languages ?? ["EN"],
      bioDuo: existing?.bioDuo ?? "",
    },
  })

  async function onSubmit(values: DuoProfileInput) {
    setLoading(true)
    try {
      const res = await fetch("/api/duo/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(existing ? "Duo profile updated!" : "Duo profile created!")
      router.push("/duo")
      router.refresh()
    } catch {
      toast.error("Failed to save duo profile")
    } finally {
      setLoading(false)
    }
  }

  function toggleArrayField<T extends string>(
    current: T[],
    value: T,
    onChange: (v: T[]) => void
  ) {
    if (current.includes(value)) {
      onChange(current.filter((v) => v !== value))
    } else {
      onChange([...current, value])
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Active toggle */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
              </FormControl>
              <div>
                <FormLabel className="!mt-0 cursor-pointer">Visible in duo finder</FormLabel>
                <p className="text-xs text-muted-foreground">Others can find and contact you</p>
              </div>
            </FormItem>
          )}
        />

        {/* Roles I play */}
        <FormField
          control={form.control}
          name="preferredRoles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles I play</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {ROLES.filter((r) => r.value !== "FILL").map((role) => {
                    const selected = field.value.includes(role.value)
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleArrayField(field.value, role.value, field.onChange)}
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

        {/* Roles I want in partner */}
        <FormField
          control={form.control}
          name="preferredPartnerRoles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Partner roles I prefer <span className="text-muted-foreground font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {ROLES.filter((r) => r.value !== "FILL").map((role) => {
                    const selected = field.value.includes(role.value)
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => toggleArrayField(field.value, role.value, field.onChange)}
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
            </FormItem>
          )}
        />

        {/* Vibe tags */}
        <FormField
          control={form.control}
          name="vibeTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vibe / playstyle tags</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {VIBE_TAGS.map((tag) => {
                    const selected = field.value.includes(tag.value)
                    return (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => toggleArrayField(field.value, tag.value, field.onChange)}
                        className={cn(
                          "px-3 h-8 rounded-full border text-xs font-medium transition-all",
                          selected
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border/50 text-muted-foreground hover:border-border"
                        )}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Communication style */}
        <FormField
          control={form.control}
          name="communicationStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Communication style</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {COMMUNICATION_STYLES.map((style) => {
                    const selected = field.value.includes(style.value)
                    return (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => toggleArrayField(field.value, style.value, field.onChange)}
                        className={cn(
                          "px-3 h-8 rounded-full border text-xs font-medium transition-all",
                          selected
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border/50 text-muted-foreground hover:border-border"
                        )}
                      >
                        {style.label}
                      </button>
                    )
                  })}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Duo bio */}
        <FormField
          control={form.control}
          name="bioDuo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Duo bio <span className="text-muted-foreground font-normal">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What kind of duo partner are you looking for?"
                  className="resize-none"
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {existing ? "Save Changes" : "Create Profile"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
