import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { RootProviders } from "@/components/layouts/RootProviders"

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Loltracker — Ranked Companion for Serious Players",
    template: "%s — Loltracker",
  },
  description:
    "Accountability, duo matching, and anti-tilt analytics for League of Legends ranked players. Stop grinding blind — start grinding smart.",
  keywords: ["league of legends", "ranked", "duo", "tilt", "accountability", "coach", "climb"],
  openGraph: {
    title: "Loltracker",
    description: "Grind smarter. Tilt less. Find your duo.",
    type: "website",
    siteName: "Loltracker",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  )
}
