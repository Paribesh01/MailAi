"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "For individuals getting started with smart email.",
    features: [
      "Up to 200 emails/month AI triage",
      "3 AI draft replies per day",
      "Smart inbox splitting",
      "Basic noise filtering",
      "Gmail integration",
    ],
    cta: "Get started free",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "12",
    period: "per month",
    description: "For power users who live in their inbox.",
    features: [
      "Unlimited AI triage",
      "Unlimited AI draft replies",
      "AI voice training",
      "Smart follow-ups",
      "Thread summarization",
      "Priority support",
    ],
    cta: "Start Pro trial",
    href: "/login",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Team",
    price: "49",
    period: "per month",
    description: "For teams that want a shared, intelligent inbox layer.",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Shared follow-up tracking",
      "Team analytics",
      "Custom AI personas",
      "Dedicated support",
    ],
    cta: "Talk to sales",
    href: "/login",
    highlight: false,
  },
]

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section id="pricing" className="py-32 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Simple,{" "}
            <span className="gradient-text">honest pricing</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg"
          >
            No seat fees. No hidden costs. Start free, upgrade when you need more.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
              className={`relative rounded-2xl p-6 ${
                plan.highlight
                  ? "bg-gradient-to-b from-indigo-500/15 to-purple-500/10 border border-indigo-500/40 shadow-2xl shadow-indigo-500/10"
                  : "bg-white/[0.03] border border-white/8"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                    <Sparkles className="w-3 h-3" /> {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-white/40">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-sm text-white/30 mb-1.5">/{plan.period}</span>
                </div>
              </div>

              <Link href={plan.href}>
                <Button
                  className={`w-full mb-6 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-400" : "text-white/30"}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
