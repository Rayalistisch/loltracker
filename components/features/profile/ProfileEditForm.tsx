"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { profileEditSchema, type ProfileEditInput } from "@/lib/validators/profile"
import { ROLES, REGIONS, RANKS, DIVISIONS } from "@/lib/utils/lol-constants"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { PlayerProfile } from "@/types/domain"
import { useState } from "react"

interface ProfileEditFormProps {
  profile: PlayerProfile
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: profile.displayName ?? "",
      bio: profile.bio ?? "",
      region: profile.region,
      mainRole: profile.mainRole,
      secondaryRole: profile.secondaryRole ?? "",
      riotId: profile.riotId ?? "",
      currentRank: profile.currentRank ?? "",
      lookingForDuo: profile.lookingForDuo,
      isPublic: profile.isPublic,
    },
  })

  async function onSubmit(values: ProfileEditInput) {
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Profile updated")
      router.push("/profile")
      router.refresh()
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input {...field} />
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
                <Textarea className="resize-none" rows={3} {...field} />
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
            </FormItem>
          )}
        />

        {/* Current rank — manual fallback since Riot API has limited dev key access */}
        <div>
          <p className="text-sm font-medium mb-2">
            Rank <span className="text-muted-foreground font-normal">(Solo/Duo)</span>
          </p>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {RANKS.map((r) => {
                const currentVal: string = form.watch("currentRank") ?? ""
                const isSelected = currentVal.startsWith(r.value)
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      const div = currentVal.includes(" ") ? currentVal.split(" ")[1] : "IV"
                      form.setValue("currentRank", `${r.value} ${div}`)
                    }}
                    className={cn(
                      "px-2.5 h-8 rounded border text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    )}
                  >
                    {r.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => form.setValue("currentRank", "")}
                className={cn(
                  "px-2.5 h-8 rounded border text-xs font-medium transition-all",
                  !form.watch("currentRank")
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border/50 text-muted-foreground hover:border-border"
                )}
              >
                Unranked
              </button>
            </div>
            {form.watch("currentRank") && (
              <div className="flex gap-1.5">
                {(["IV", "III", "II", "I"] as const).map((div) => {
                  const currentVal: string = form.watch("currentRank") ?? ""
                  const tier = currentVal.split(" ")[0]
                  const isSelected = currentVal.endsWith(div)
                  return (
                    <button
                      key={div}
                      type="button"
                      onClick={() => form.setValue("currentRank", `${tier} ${div}`)}
                      className={cn(
                        "px-3 h-8 rounded border text-xs font-medium transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      {div}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <FormControl>
                <div className="grid grid-cols-4 gap-2">
                  {REGIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => field.onChange(r.value)}
                      className={cn(
                        "h-9 rounded-lg border text-sm font-medium transition-all",
                        field.value === r.value
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border/50 text-muted-foreground hover:border-border"
                      )}
                    >
                      {r.value}
                    </button>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

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

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="lookingForDuo"
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
                <FormLabel className="!mt-0 cursor-pointer">Looking for duo partner</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublic"
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
                <FormLabel className="!mt-0 cursor-pointer">Public profile (visible to others)</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
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
