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
      <div className="h-48 rounded-xl bg-white border border-taupe flex flex-col items-center justify-center gap-4 p-4 shadow-[0_2px_8px_rgba(45,42,38,0.06)]">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-taupe/50 border border-tan w-full max-w-xs">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm text-espresso">Continue with Google</span>
          <div className="ml-auto w-2 h-2 rounded-full bg-sage animate-pulse" />
        </div>
        <div className="flex gap-2 text-[10px] text-stone-warm">
          <span className="px-2 py-1 rounded bg-taupe">Read emails</span>
          <span className="px-2 py-1 rounded bg-taupe">Send emails</span>
          <span className="px-2 py-1 rounded bg-taupe">Manage labels</span>
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
      <div className="h-48 rounded-xl bg-white border border-taupe overflow-hidden p-3 space-y-2 shadow-[0_2px_8px_rgba(45,42,38,0.06)]">
        {[
          { name: "Alex Mercer", sub: "Urgent: contract renewal", cat: "Needs attention", catClass: "bg-coral-light text-coral" },
          { name: "Weekly Digest", sub: "Top stories this week", cat: "Ignore", catClass: "bg-taupe text-stone-warm" },
          { name: "Priya Kumar", sub: "Quick question on the deck", cat: "Can wait", catClass: "bg-sand-light text-sand" },
        ].map((row, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-cream border border-taupe/60"
          >
            <div className="w-6 h-6 rounded-full bg-sand-light shrink-0 flex items-center justify-center text-[10px] text-espresso font-semibold">
              {row.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-espresso truncate">{row.name}</p>
              <p className="text-[9px] text-stone-warm truncate">{row.sub}</p>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${row.catClass}`}>{row.cat}</span>
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
      <div className="h-48 rounded-xl bg-white border border-taupe p-3 flex flex-col gap-2 shadow-[0_2px_8px_rgba(45,42,38,0.06)]">
        <div className="text-[9px] text-stone-warm mb-1 flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
          AI Draft — matches your writing style
        </div>
        <div className="flex-1 rounded-lg bg-cream border border-taupe p-3 text-[10px] text-espresso leading-relaxed">
          Hi Alex, thanks for flagging this — I&apos;ll loop in legal by EOD and make sure
          everything&apos;s signed off before the deadline. Let me know if anything else needs unblocking.
        </div>
        <div className="flex gap-2">
          <div className="flex-1 rounded bg-taupe px-2 py-1 text-[9px] text-stone-warm">
            make it shorter...
          </div>
          <div className="px-2 py-1 rounded bg-sage text-white text-[9px] font-medium">Send ↗</div>
        </div>
      </div>
    ),
  },
]

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-2xl bg-coral/10 border border-coral/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-coral" />
          <span className="absolute -top-2 -right-2 text-[10px] font-bold text-espresso bg-sand-light rounded-full w-5 h-5 flex items-center justify-center border border-tan">
            {index + 1}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-espresso">{step.label}</h3>
      </div>
      {step.visual}
      <p className="text-sm text-stone-warm leading-relaxed">{step.description}</p>
    </motion.div>
  )
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="how-it-works" className="py-32 bg-white border-y border-taupe relative">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-stone-warm mb-4"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-espresso tracking-tight"
          >
            Up and running in{" "}
            <span className="text-coral">2 minutes</span>
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 relative">
          <div className="hidden lg:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-taupe via-tan to-taupe" />
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
