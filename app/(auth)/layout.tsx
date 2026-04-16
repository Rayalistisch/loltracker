import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image";
export const metadata: Metadata = {
  title: {
    template: "%s — Loltracker",
    default: "Auth — Loltracker",
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Gradient orb */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
  <Image
    src="/lol_tracker.png"
    alt="LoLTracker logo"
    width={140}
    height={42}
    className="h-10 w-auto object-contain"
    priority
  />
  <span className="text-base font-bold tracking-tight text-foreground">
    LoLTracker
  </span>
</Link>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          {children}
        </div>
      </div>

      <p className="relative mt-8 text-xs text-muted-foreground text-center">
        By using Loltracker you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground transition-colors">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}
