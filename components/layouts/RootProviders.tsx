"use client"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground",
            success: "border-primary/30",
            error: "border-destructive/30",
          },
        }}
      />
    </TooltipProvider>
  )
}
