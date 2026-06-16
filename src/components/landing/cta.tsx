"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail } from "lucide-react"

export function CTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-32 bg-[#080810] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none" />

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-600/20 via-purple-600/25 to-pink-600/20 blur-[80px] rounded-full"
        />
      </div>

      <div ref={ref} className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl p-12 bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-indigo-900/40 border border-indigo-500/20 shadow-2xl relative overflow-hidden"
        >
          {/* Inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 animate-float-slow"
          >
            <Mail className="w-7 h-7 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
          >
            Your inbox is waiting.
            <br />
            <span className="gradient-text">Take it back.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.25 }}
            className="text-white/40 mb-8 text-lg max-w-md mx-auto"
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
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 group"
              >
                Start for free — no card needed
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-xs text-white/20 mt-5"
          >
            2-minute setup · Works with Gmail · Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
