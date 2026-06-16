"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Sparkles, Zap, Bell, Filter, Reply, BarChart3 } from "lucide-react"

const FEATURES = [
  {
    icon: Zap,
    label: "Smart inbox splitting",
    description:
      "Claude reads every email and instantly splits your inbox into Needs Attention, Can Wait, and Ignore — so you always know where to look first.",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  {
    icon: Sparkles,
    label: "Draft replies in your voice",
    description:
      "MailAI learns your writing style from past emails and generates replies that sound exactly like you — not a robot. Edit or send with one click.",
    gradient: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  {
    icon: Bell,
    label: "Smart follow-ups",
    description:
      "AI determines the perfect time to follow up on unanswered threads and auto-generates the message. Nothing falls through the cracks.",
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
    glow: "shadow-pink-500/20",
  },
  {
    icon: Filter,
    label: "Noise filtering",
    description:
      "Cold emails, newsletters, and automated alerts are silently moved aside. Your inbox shows only what a human actually wrote to you.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  {
    icon: Reply,
    label: "Improve any draft",
    description:
      'Wrote a draft yourself? Tell MailAI "make it shorter", "sound more assertive", or "add a CTA" and it rewrites it instantly.',
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
    glow: "shadow-violet-500/20",
  },
  {
    icon: BarChart3,
    label: "Thread summarization",
    description:
      "Long 30-message threads condensed to 2 sentences. Instantly know what was discussed and what action you need to take.",
    gradient: "from-sky-500/20 to-blue-500/20",
    border: "border-sky-500/20",
    iconColor: "text-sky-400",
    glow: "shadow-sky-500/20",
  },
]

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const Icon = feature.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative rounded-2xl p-6 bg-gradient-to-br ${feature.gradient} border ${feature.border} hover:shadow-2xl ${feature.glow} transition-all duration-500 hover:-translate-y-1 overflow-hidden`}
    >
      {/* Hover glow blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${feature.gradient} blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />

      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} border ${feature.border} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className={`w-5 h-5 ${feature.iconColor}`} />
      </div>

      <h3 className="text-base font-semibold text-white mb-2">{feature.label}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true })

  return (
    <section id="features" className="py-32 bg-[#0a0a0f] relative overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Title */}
        <div ref={titleRef} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4"
          >
            Everything you need
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-5 tracking-tight"
          >
            Email that works{" "}
            <span className="gradient-text">for you</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/40 max-w-xl mx-auto"
          >
            Six AI-powered features that turn your inbox from a source of stress into a competitive advantage.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.label} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
