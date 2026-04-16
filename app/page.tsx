import Link from "next/link"
import { MissionSequence } from "@/components/landing/MissionSequence"
import { LiveMatchIntelligence } from "@/components/landing/LiveMatchIntelligence"
import {
  Brain, Users2, Target, TrendingUp,
  CheckCircle2, Trophy,
} from "lucide-react"

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        "font-headline tracking-[0.05em] uppercase font-bold text-sm transition-colors",
        active
          ? "text-[#a4e6ff] border-l-2 border-[#a4e6ff] pl-2"
          : "text-slate-400 hover:text-[#a4e6ff] pl-0",
      ].join(" ")}
    >
      {children}
    </Link>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#111318", color: "#e2e2e9", fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-xl"
        style={{
          background: "rgba(17,19,24,0.85)",
          borderBottom: "1px solid rgba(164,230,255,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex justify-between items-center px-8 h-20 max-w-[1920px] mx-auto">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tighter uppercase"
            style={{
              color: "#a4e6ff",
              textShadow: "0 0 10px rgba(164,230,255,0.5)",
              fontFamily: "var(--font-headline, sans-serif)",
            }}
          >
            LoLTracker
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/" active>Dashboard</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2 font-bold uppercase tracking-widest text-xs transition-all hover:bg-[rgba(164,230,255,0.16)]"
              style={{
                background: "rgba(164,230,255,0.08)",
                border: "1px solid rgba(164,230,255,0.28)",
                color: "#a4e6ff",
                fontFamily: "var(--font-headline, sans-serif)",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.45 }}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(17,19,24,0.15), rgba(17,19,24,0.80) 65%, #111318)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #111318, transparent 35%, transparent 65%, #111318)", opacity: 0.55 }} />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          {/* Headline */}
          <h1
            className="text-5xl md:text-8xl font-bold tracking-tighter leading-none uppercase mb-6"
            style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
          >
            Grind <span style={{ color: "#a4e6ff", fontStyle: "italic" }}>smarter</span>.<br />
            Tilt <span style={{ color: "#ddb7ff", fontStyle: "italic" }}>less</span>.<br />
            Find your <span style={{ color: "#ffd692", fontStyle: "italic" }}>duo</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl mb-10 leading-relaxed" style={{ color: "#bbc9cf" }}>
            The technical vanguard for competitive League of Legends. Transform your mental state and match history into a tactical blueprint for climbing.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              href="/register"
              className="relative group px-10 py-5 font-extrabold uppercase tracking-widest overflow-hidden transition-all"
              style={{
                background: "#a4e6ff",
                color: "#003543",
                fontFamily: "var(--font-headline, sans-serif)",
              }}
            >
              <span className="relative z-10">Start for free</span>
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
            </Link>
            <Link
              href="#features"
              className="px-10 py-5 font-bold uppercase tracking-widest transition-all"
              style={{
                border: "1px solid rgba(59,73,78,0.8)",
                background: "rgba(30,31,37,0.4)",
                backdropFilter: "blur(8px)",
                color: "#e2e2e9",
                fontFamily: "var(--font-headline, sans-serif)",
              }}
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value Prop ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ background: "#0c0e13" }}>
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">

            {/* Left */}
            <div className="lg:w-1/2">
              <h2
                className="text-4xl md:text-5xl font-bold tracking-tight uppercase leading-tight mb-8"
                style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
              >
                Stats sites tell you{" "}
                <span style={{ color: "#859399" }}>what happened</span>.<br />
                We tell you <span style={{ color: "#a4e6ff" }}>why</span>.
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#bbc9cf" }}>
                Raw data is just noise without context. LoLTracker analyzes the biomechanics of your gameplay — pacing, tilt triggers, and decision-making fatigue — to provide actionable intelligence.
              </p>
              <ul className="space-y-6">
                {[
                  { icon: TrendingUp, color: "#a4e6ff", title: "Predictive Tilt Analytics", desc: "Know exactly when your performance starts to dip before the LP loss." },
                  { icon: Brain,      color: "#ffd692", title: "Cognitive Load Monitoring",  desc: "Measure your mental stamina across extended gaming sessions." },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <li key={title} className="flex items-start gap-4">
                    <div className="p-2 rounded-lg shrink-0" style={{ background: `${color}18` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase text-sm tracking-wider mb-1" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>{title}</h4>
                      <p className="text-sm" style={{ color: "#bbc9cf" }}>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: animated mock card */}
            <div className="lg:w-1/2 w-full">
              <LiveMatchIntelligence />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Bento Grid ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.22 }}
        >
          <source src="/features-bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "rgba(17,19,24,0.80)" }} />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h3
              className="text-3xl font-bold uppercase tracking-widest mb-3"
              style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
            >
              Tactical Operations
            </h3>
            <div className="w-24 h-1 mx-auto" style={{ background: "#ffd692" }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Feature 1 — large */}
            <div
              className="md:col-span-8 group relative overflow-hidden p-8 rounded-2xl transition-all"
              style={{
                background: "rgba(30,31,37,0.6)", backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(164,230,255,0.15)",
                border: "1px solid rgba(164,230,255,0.1)",
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none rounded-full" style={{ background: "rgba(164,230,255,0.04)", filter: "blur(100px)" }} />
              <Target className="h-9 w-9 mb-6" style={{ color: "#a4e6ff" }} />
              <h4 className="text-2xl font-bold uppercase mb-4 tracking-tight" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>Stop playing on autopilot</h4>
              <p className="max-w-lg mb-8" style={{ color: "#bbc9cf" }}>
                Pre-game check-ins, post-game reflections, and discipline scores that show you exactly where your grind falls apart — and how to fix it.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["#a4e6ff", "#ddb7ff", "#ffd692"].map((c, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ borderColor: "#111318", background: `${c}22`, color: c }}>
                      {["SG", "KP", "MF"][i]}
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-[9px] font-bold" style={{ borderColor: "#111318", background: "rgba(30,31,37,0.9)", color: "#bbc9cf" }}>+2.4k</div>
                </div>
                <span className="text-xs uppercase tracking-widest" style={{ color: "#bbc9cf", fontFamily: "var(--font-headline, sans-serif)" }}>Active Pilots Engaged</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div
              className="md:col-span-4 group relative overflow-hidden p-8 rounded-2xl transition-all"
              style={{
                background: "rgba(30,31,37,0.6)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(221,183,255,0.1)",
              }}
            >
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(221,183,255,0.08)", filter: "blur(80px)" }} />
              <Brain className="h-9 w-9 mb-6" style={{ color: "#ddb7ff" }} />
              <h4 className="text-2xl font-bold uppercase mb-4 tracking-tight" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>Anti-Tilt Analytics</h4>
              <p className="text-sm mb-6" style={{ color: "#bbc9cf" }}>Real-time alerts that tell you when to take a break before you throw three games in a row.</p>
              <div
                className="p-4 text-xs italic uppercase"
                style={{ background: "rgba(221,183,255,0.05)", borderLeft: "4px solid #ddb7ff", color: "#ddb7ff" }}
              >
                "Loss Streak Warning: System cooldown recommended for 15m."
              </div>
            </div>

            {/* Feature 3 */}
            <div
              className="md:col-span-4 group relative overflow-hidden p-8 rounded-2xl transition-all"
              style={{
                background: "rgba(30,31,37,0.6)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(253,214,93,0.1)",
              }}
            >
              <Users2 className="h-9 w-9 mb-6" style={{ color: "#ffd692" }} />
              <h4 className="text-2xl font-bold uppercase mb-4 tracking-tight" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>Find a duo</h4>
              <p className="text-sm mb-6" style={{ color: "#bbc9cf" }}>Stop gambling with randoms. Matched on synergy, playstyle compatibility, and mental resilience scores.</p>
              <Link
                href="/register"
                className="block w-full py-3 text-center font-bold uppercase tracking-widest text-xs transition-all"
                style={{ border: "1px solid rgba(253,214,93,0.3)", color: "#ffd692", fontFamily: "var(--font-headline, sans-serif)" }}
              >
                Match Me
              </Link>
            </div>

            {/* Feature 4 */}
            <div
              className="md:col-span-8 relative overflow-hidden p-8 rounded-2xl flex items-center justify-between"
              style={{ background: "rgba(40,42,47,0.9)", border: "1px solid rgba(60,73,78,0.4)" }}
            >
              <div>
                <h4 className="text-2xl font-bold uppercase mb-2 tracking-tight" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>Global Leaderboard</h4>
                <p className="text-sm mb-6 max-w-md" style={{ color: "#bbc9cf" }}>Compare your discipline and mental resilience scores against the top 1% of the ladder.</p>
                <div className="flex gap-3">
                  <span className="px-3 py-1 text-xs font-bold rounded" style={{ background: "#0c0e13", color: "#5e4100" }}>RANK #420</span>
                  <span className="px-3 py-1 text-xs font-bold rounded" style={{ background: "#0c0e13", color: "#a4e6ff" }}>TIER: ELITE</span>
                </div>
              </div>
              <Trophy className="hidden lg:block h-32 w-32 shrink-0" style={{ color: "#e2e2e9", opacity: 0.06 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission Sequence ───────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: "rgba(26,27,33,0.95)" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold uppercase tracking-widest" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>
              Mission Sequence
            </h3>
          </div>
          <MissionSequence />
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div
              className="p-10 rounded-2xl flex flex-col items-center text-center"
              style={{
                background: "rgba(30,31,37,0.6)", backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(164,230,255,0.12)",
                border: "1px solid rgba(60,73,78,0.35)",
              }}
            >
              <h4 className="text-xl font-bold uppercase mb-2" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>Summoner</h4>
              <div className="text-4xl font-bold mb-6" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>FREE</div>
              <ul className="space-y-4 mb-10 text-left w-full">
                {["Basic session history", "Tilt risk indicator", "Public duo finder"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#bbc9cf" }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#a4e6ff" }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full py-4 text-center font-bold uppercase tracking-widest text-xs block transition-all mt-auto"
                style={{ border: "1px solid rgba(60,73,78,0.6)", color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
              >
                Choose Free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative p-[2px] rounded-2xl" style={{ background: "linear-gradient(135deg, #a4e6ff, #ffd692, #ddb7ff)", boxShadow: "0 0 40px -10px rgba(164,230,255,0.35)" }}>
              <div className="h-full w-full p-10 rounded-2xl flex flex-col items-center text-center relative overflow-hidden" style={{ background: "rgba(40,42,47,0.98)" }}>
                <div className="absolute top-0 right-0 px-4 py-1 text-[10px] font-bold uppercase tracking-tight" style={{ background: "#ffd692", color: "#422c00", fontFamily: "var(--font-headline, sans-serif)" }}>
                  Recommended
                </div>
                <h4 className="text-xl font-bold uppercase mb-2" style={{ color: "#a4e6ff", fontFamily: "var(--font-headline, sans-serif)" }}>Challenger</h4>
                <div className="text-4xl font-bold mb-1" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>
                  €9<span className="text-sm font-normal" style={{ color: "#bbc9cf" }}>/mo</span>
                </div>
                <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#ffd692", fontFamily: "var(--font-headline, sans-serif)" }}>Elite Performance Suite</p>
                <ul className="space-y-4 mb-10 text-left w-full">
                  {["Real-time Live Match HUD", "Advanced Tilt Bio-feedback", "AI-Powered Duo Matchmaking", "Priority API Fetching"].map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#e2e2e9" }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#a4e6ff" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="w-full py-4 text-center font-bold uppercase tracking-widest text-xs block transition-all mt-auto"
                  style={{ background: "#a4e6ff", color: "#003543", fontFamily: "var(--font-headline, sans-serif)" }}
                >
                  Go Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24" style={{ background: "#111318" }}>
        <div className="container mx-auto px-6 max-w-3xl">
          <h3
            className="text-3xl font-bold uppercase text-center mb-12 tracking-widest"
            style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
          >
            Intelligence Briefing
          </h3>
          <div className="space-y-4">
            {[
              { q: "Is this allowed by Riot Games?", a: "Yes. LoLTracker strictly uses Riot's official API and does not modify game files or provide any automation. We are fully compliant with Third Party guidelines." },
              { q: "How does Anti-Tilt detection work?", a: "It's rule-based — not AI. It analyzes your check-in data, session results, mental state ratings, and whether you followed your own stop conditions. Transparent logic, no black box." },
              { q: "Is it free?", a: "Core features are free during early access. A Pro tier with advanced analytics and unlimited session history is planned at €9/mo." },
              { q: "Does it work on Mac?", a: "Yes. LoLTracker is a web platform — it works on any device with a browser." },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="p-6 rounded-lg"
                style={{ background: "rgba(30,31,37,0.8)", border: "1px solid rgba(60,73,78,0.35)" }}
              >
                <h4 className="font-bold uppercase text-sm tracking-wide mb-3" style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}>{q}</h4>
                <p className="text-sm leading-relaxed" style={{ color: "#bbc9cf" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        className="py-12 px-8"
        style={{ background: "#111318", borderTop: "1px solid rgba(164,230,255,0.08)" }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto">
          <div className="text-xl font-bold italic uppercase tracking-tighter" style={{ color: "#ffd692", fontFamily: "var(--font-headline, sans-serif)" }}>
            LoLTracker
          </div>
          <div className="flex gap-8">
            {["Terms of Service", "Privacy Policy", "Contact Support"].map(l => (
              <Link key={l} href="#" className="text-sm tracking-wide transition-colors" style={{ color: "#64748b" }}>
                {l}
              </Link>
            ))}
          </div>
          <p className="text-sm tracking-wide text-center md:text-right" style={{ color: "#64748b" }}>
            © 2025 LoLTracker. Tactical Vanguard Interface.
          </p>
        </div>
      </footer>
    </div>
  )
}
