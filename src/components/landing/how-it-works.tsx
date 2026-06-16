"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Link2, Brain, Send } from "lucide-react"

const STEPS = [
  {
    number: "01",
    icon: Link2,
    label: "Connect your Gmail",
    description:
      "Sign in with Google in under 30 seconds. MailAI requests only the minimum permissions needed — read and send. Your data never leaves your account.",
    visual: (
      <div className="h-48 rounded-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 flex flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 w-full max-w-xs">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm text-white/80">Continue with Google</span>
          <div className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="flex gap-2 text-[10px] text-white/30">
          <span className="px-2 py-1 rounded bg-white/5">Read emails</span>
          <span className="px-2 py-1 rounded bg-white/5">Send emails</span>
          <span className="px-2 py-1 rounded bg-white/5">Manage labels</span>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    icon: Brain,
    label: "AI triages everything",
    description:
      "Claude reads each email and categorises it in milliseconds. It learns your context — who your colleagues are, what needs replies vs. what's just noise.",
    visual: (
      <div className="h-48 rounded-xl bg-gradient-to-br from-violet-900/40 to-indigo-900/20 border border-violet-500/20 overflow-hidden p-3 space-y-2">
        {[
          { name: "Alex Mercer", sub: "Urgent: contract renewal", cat: "Needs attention", catColor: "bg-red-500/20 text-red-400" },
          { name: "Weekly Digest", sub: "Top stories this week", cat: "Ignore", catColor: "bg-slate-500/20 text-slate-400" },
          { name: "Priya Kumar", sub: "Quick question on the deck", cat: "Can wait", catColor: "bg-amber-500/20 text-amber-400" },
        ].map((row, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5"
          >
            <div className="w-6 h-6 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-[10px] text-white/50">
              {row.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-white/80 truncate">{row.name}</p>
              <p className="text-[9px] text-white/30 truncate">{row.sub}</p>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${row.catColor}`}>{row.cat}</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    number: "03",
    icon: Send,
    label: "Reply in seconds",
    description:
      "Open any thread, hit Reply, and Claude generates a draft in your voice. Add instructions like \"be brief\" or \"push back politely\" and it rewrites instantly.",
    visual: (
      <div className="h-48 rounded-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border border-emerald-500/20 p-3 flex flex-col gap-2">
        <div className="text-[9px] text-white/30 mb-1 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Draft — matches your writing style
        </div>
        <div className="flex-1 rounded-lg bg-white/5 p-3 text-[10px] text-white/60 leading-relaxed">
          Hi Alex, thanks for flagging this — I'll loop in legal by EOD and make sure
          everything's signed off before the deadline. Let me know if anything else needs unblocking.
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded bg-white/5 px-2 py-1 text-[9px] text-white/30">
            make it shorter...
          </div>
          <div className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-medium">Send ↗</div>
        </div>
      </div>
    ),
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="how-it-works" className="py-32 bg-[#080810] relative">
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-purple-400 mb-4"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Up and running in{" "}
            <span className="gradient-text">2 minutes</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/20 via-purple-500/50 to-indigo-500/20" />

          {STEPS.map((step, i) => {
            const stepRef = useRef<HTMLDivElement>(null)
            const stepInView = useInView(stepRef, { once: true, margin: "-60px" })
            const Icon = step.icon

            return (
              <motion.div
                key={step.number}
                ref={stepRef}
                initial={{ opacity: 0, y: 40 }}
                animate={stepInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-5"
              >
                {/* Number + icon */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-400" />
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold text-white/30 bg-white/5 rounded-full w-5 h-5 flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.label}</h3>
                </div>

                {/* Visual */}
                {step.visual}

                {/* Description */}
                <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
