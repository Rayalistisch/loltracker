"use client"

import { motion } from "framer-motion"

const STEPS = [
  { n: "01", title: "Connect ID",   desc: "Securely link your Riot ID for deep API access." },
  { n: "02", title: "Analyze DNA",  desc: "We build your behavioral profile from your sessions." },
  { n: "03", title: "Live Sync",    desc: "Launch the tracker alongside your client." },
  { n: "04", title: "Climb Faster", desc: "Execute game plans and monitor your tilt live." },
]

export function MissionSequence() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
      {STEPS.map(({ n, title, desc }, i) => (
        <motion.div
          key={n}
          className="relative p-6 text-center"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: i * 0.18, ease: "easeOut" }}
        >
          {/* Circle */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 text-xl font-bold"
            style={{
              background: "rgba(30,31,37,0.9)",
              border: "1px solid rgba(164,230,255,0.3)",
              color: "#a4e6ff",
              fontFamily: "var(--font-headline, sans-serif)",
              boxShadow: "0 0 16px rgba(164,230,255,0.08)",
            }}
          >
            {n}
          </div>

          <h5
            className="font-bold uppercase mb-2"
            style={{ color: "#e2e2e9", fontFamily: "var(--font-headline, sans-serif)" }}
          >
            {title}
          </h5>
          <p className="text-sm" style={{ color: "#bbc9cf" }}>{desc}</p>
        </motion.div>
      ))}

      {/* Connector line */}
      <div
        className="absolute top-14 left-0 w-full h-px hidden md:block"
        style={{ background: "rgba(164,230,255,0.08)" }}
      />
    </div>
  )
}
