import Link from "next/link"
import Image from "next/image";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Users2,
  Brain,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Flame,
  Shield,
} from "lucide-react"

// ─── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Target,
    label: "Accountability",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    headline: "Stop playing on autopilot.",
    description:
      "Pre-game check-ins, post-game reflections, and weekly discipline scores that show you exactly where your grind falls apart.",
    bullets: [
      "Set session intentions before queuing",
      "Reflect after each session — not just after losing",
      "Track your discipline score over time",
      "Spot patterns: when do you ignore your own rules?",
    ],
  },
  {
    icon: Brain,
    label: "Anti-Tilt Analytics",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    headline: "Know when to stop before you throw.",
    description:
      "Rule-based behavioral analysis that tracks your tilt signals across sessions and tells you exactly when your performance is dropping — before you grief three games in a row.",
    bullets: [
      "Tilt score updated after every session",
      "Loss streak detection + stop recommendations",
      "Best and worst play windows by day and time",
      "Session fatigue analysis",
    ],
  },
  {
    icon: Users2,
    label: "Duo Matching",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    headline: "Find a duo that actually fits.",
    description:
      "Compatibility scores based on rank proximity, role synergy, play times, communication style, and grind mentality. No more random discord partner pings.",
    bullets: [
      "Role synergy scoring (not just same rank)",
      "Availability overlap matching",
      "Filter by vibe, goals, and communication style",
      "Send duo requests without leaving the platform",
    ],
  },
]

const FAQ_ITEMS = [
  {
    q: "Is this affiliated with Riot Games?",
    a: "No. Loltracker is an independent platform. We use manually entered Riot IDs for account linking. No live game data is accessed or required.",
  },
  {
    q: "Is this free?",
    a: "The core features are free during our early access period. A Pro tier with advanced analytics and unlimited session history is planned.",
  },
  {
    q: "Does this work with any region?",
    a: "Yes. We support all major League of Legends regions including EUW, NA, KR, EUNE, and more.",
  },
  {
    q: "How does the tilt score work?",
    a: "It's rule-based — not AI. It analyzes your check-in data, session results, mental state ratings, and whether you followed your own stop conditions. No black box.",
  },
  {
    q: "Can I use this without linking a Riot account?",
    a: "Yes. You can use all accountability and reflection features manually. Riot linking is optional and used only for displaying your rank.",
  },
  {
    q: "How is this different from U.GG or OP.GG?",
    a: "Those show you stats. We focus on behavior, habits, and mental game. We don't show you your CS numbers — we show you whether you're tilted and whether you should queue up.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-26 flex items-center justify-between">
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

          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-xl text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-xl text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#faq" className="text-xl text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
  <Button
    variant="ghost"
    className="h-11 px-5 text-base font-medium"
    asChild
  >
    <Link href="/login">Sign in</Link>
  </Button>

  <Button
    className="h-11 px-6 text-base font-semibold rounded-xl"
    asChild
  >
    <Link href="/register">Get started</Link>
  </Button>
</div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center">

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-6">
            Grind smarter.
            <br />
            <span className="gradient-text">Tilt less.</span>
            <br />
            Find your duo.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The ranked companion platform for serious League players.
            Accountability tools, behavioral analytics, and compatibility-scored duo matching. All in one place.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-12 flex-wrap">
            {[
              { value: "3", label: "Core modules" },
              { value: "100%", label: "Behavior-focused" },
              { value: "0", label: "Meaningless stats" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 border-y border-border/50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
            Stats sites tell you{" "}
            <span className="text-muted-foreground line-through">what</span> happened.
            <br />
            We tell you <span className="gradient-text">why</span>.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            You already know your KDA. You don&apos;t need another bar chart of your champion win rates.
            What you need to know is: did you tilt after that loss? Did you ignore your own stop condition?
            Are you playing better on Thursdays at 8pm? Is your duo partner actually making you win more?
          </p>
          <p className="text-base text-muted-foreground leading-relaxed mt-4">
            Loltracker tracks the things that actually matter for climbing — your habits, your mental state, and your decisions around the game.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              Three tools. One goal.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Everything you need to build better habits, protect your mental, and find the right people to grind with.
            </p>
          </div>

          <div className="space-y-24">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              const isReversed = i % 2 !== 0

              return (
                <div
                  key={feature.label}
                  className={`flex flex-col md:flex-row items-start gap-12 ${isReversed ? "md:flex-row-reverse" : ""}`}
                >
                  <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-5 ${feature.bg} ${feature.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {feature.label}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                      {feature.headline}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                    <ul className="space-y-2.5">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${feature.color}`} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 w-full">
                    <div className={`rounded-2xl border ${feature.bg} h-64 md:h-80 flex items-center justify-center`}>
                      <div className="text-center">
                        <Icon className={`h-12 w-12 mx-auto mb-3 ${feature.color} opacity-60`} />
                        <p className={`text-sm font-medium ${feature.color}`}>{feature.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-card/30 border-y border-border/50">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">How it works</h2>
            <p className="text-muted-foreground">Simple enough to do every session. Powerful enough to change how you play.</p>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Connect your Riot ID", desc: "Enter your game name and tag. No OAuth required — you control what you share." },
              { step: "02", title: "Check in before you queue", desc: "Rate your mental state, set a goal, and define a stop condition. 30 seconds." },
              { step: "03", title: "Track your session", desc: "Log games manually. The session panel tracks your W/L and tilt score in real time." },
              { step: "04", title: "Reflect after", desc: "Quick post-session review. Tilted? Followed your rules? What worked?" },
              { step: "05", title: "See your patterns", desc: "The analytics dashboard shows you exactly where and why your performance drops." },
            ].map((step) => (
              <div key={step.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{step.step}</span>
                </div>
                <div className="pt-1.5">
                  <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Simple pricing</h2>
          <p className="text-muted-foreground mb-12">Free during early access. Pro tier launching soon.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border p-8 text-left">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">Free</h3>
                <div className="text-3xl font-bold text-foreground">€0</div>
                <p className="text-sm text-muted-foreground mt-1">Always free</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Session tracking", "Pre/post check-ins", "Tilt score", "Duo matching", "30-day history", "Basic analytics"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/register">Get started free</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Coming soon</Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-1">Pro</h3>
                <div className="text-3xl font-bold text-foreground">€9<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                <p className="text-sm text-muted-foreground mt-1">Billed monthly</p>
              </div>
              <ul className="space-y-3 mb-8">
                {["Everything in Free", "Unlimited history", "Advanced tilt patterns", "Weekly AI summaries", "Priority duo matching", "Export your data"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full" disabled>Notify me</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative rounded-3xl border border-primary/20 bg-primary/5 p-12 overflow-hidden">
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
            <div className="relative">
              <Shield className="h-10 w-10 text-primary mx-auto mb-5" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Ready to grind smarter?</h2>
              <p className="text-muted-foreground mb-8">
                Free to start. No credit card. No API key. Just your Riot ID and a commitment to improve.
              </p>
              <Button size="lg" asChild className="h-12 px-10">
                <Link href="/register">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t border-border/50">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-center mb-12">Frequently asked</h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="border-b border-border/50 pb-6">
                <h3 className="text-base font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">LT</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Loltracker</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>Not affiliated with Riot Games</span>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Loltracker
          </p>
        </div>
      </footer>
    </div>
  )
}
