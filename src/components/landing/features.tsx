"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Sparkles, Zap, Bell, Filter, Reply, BarChart3 } from "lucide-react"

const FEATURES = [
  {
    icon: Zap,
    label: "Smart inbox splitting",
    description: "MailAI reads every email and splits your inbox into Needs Attention, Can Wait, and Ignore — so you always know where to look first.",
    iconBg: "bg-coral/10",
    iconColor: "text-coral",
    accent: "border-coral/20",
  },
  {
    icon: Sparkles,
    label: "Draft replies in your voice",
    description: "MailAI learns your writing style from past emails and generates replies that sound exactly like you. Edit or send with one click.",
    iconBg: "bg-slate-blue/10",
    iconColor: "text-slate-blue",
    accent: "border-slate-blue/20",
  },
  {
    icon: Bell,
    label: "Smart follow-ups",
    description: "AI determines the perfect time to follow up on unanswered threads and auto-generates the message. Nothing falls through the cracks.",
    iconBg: "bg-sand/15",
    iconColor: "text-sand",
    accent: "border-sand/30",
  },
  {
    icon: Filter,
    label: "Noise filtering",
    description: "Cold emails, newsletters, and automated alerts are silently moved aside. Your inbox shows only what a human actually wrote to you.",
    iconBg: "bg-sage/10",
    iconColor: "text-sage",
    accent: "border-sage/20",
  },
  {
    icon: Reply,
    label: "Improve any draft",
    description: 'Wrote a draft yourself? Tell MailAI "make it shorter" or "sound more assertive" and it rewrites it instantly.',
    iconBg: "bg-coral/10",
    iconColor: "text-coral",
    accent: "border-coral/20",
  },
  {
    icon: BarChart3,
    label: "Thread summarization",
    description: "Long 30-message threads condensed to 2 sentences. Instantly know what was discussed and what action you need to take.",
    iconBg: "bg-slate-blue/10",
    iconColor: "text-slate-blue",
    accent: "border-slate-blue/20",
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
      className={`group relative rounded-2xl p-6 bg-white border border-taupe hover:border-tan hover:shadow-[0_4px_20px_rgba(45,42,38,0.08)] transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${feature.iconColor}`} />
      </div>
      <h3 className="text-base font-semibold text-espresso mb-2">{feature.label}</h3>
      <p className="text-sm text-stone-warm leading-relaxed">{feature.description}</p>
    </motion.div>
  )
}

export function Features() {
  const titleRef = useRef<HTMLDivElement>(null)
  const titleInView = useInView(titleRef, { once: true })

  return (
    <section id="features" className="py-32 bg-cream relative">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={titleRef} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-coral mb-4"
          >
            Everything you need
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-espresso mb-5 tracking-tight"
          >
            Email that works{" "}
            <span className="text-coral">for you</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg text-stone-warm max-w-xl mx-auto"
          >
            Six AI-powered features that turn your inbox from a source of stress into a competitive advantage.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.label} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
