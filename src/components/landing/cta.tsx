"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-32 bg-cream relative overflow-hidden">
      {/* Warm glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-coral/6 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-sage/6 blur-[80px] rounded-full" />
      </div>

      <div ref={ref} className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-12 bg-white border border-taupe shadow-[0_8px_48px_rgba(45,42,38,0.10)] relative overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-coral/40 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-coral/10 flex items-center justify-center mx-auto mb-6 animate-float-slow"
          >
            <Sparkles className="w-7 h-7 text-coral" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-3xl md:text-4xl font-bold text-espresso mb-4 tracking-tight"
          >
            Your inbox is waiting.
            <br />
            <span className="text-coral">Take it back.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 }}
            className="text-stone-warm mb-8 text-lg max-w-md mx-auto"
          >
            Join thousands of professionals who&apos;ve reclaimed their mornings with MailAI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login">
              <button className="h-12 px-8 text-base rounded-xl bg-espresso text-white font-semibold shadow-[0_4px_16px_rgba(45,42,38,0.25)] hover:bg-espresso/85 transition-all duration-200 flex items-center gap-2 group">
                Start for free — no card needed
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xs text-stone-warm/50 mt-5"
          >
            2-minute setup · Works with Gmail · Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
