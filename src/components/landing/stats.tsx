"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"

const STATS = [
  { value: 94, suffix: "%", label: "Inbox triage accuracy", prefix: "" },
  { value: 3.2, suffix: "x", label: "Faster email responses", prefix: "" },
  { value: 50, suffix: "k+", label: "Emails processed daily", prefix: "" },
  { value: 4.9, suffix: "/5", label: "Average user rating", prefix: "" },
]

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(0)
  const isFloat = !Number.isInteger(value)

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(current + increment, value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)

    return () => clearInterval(timer)
  }, [inView, value])

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-bold text-white tabular-nums">
      {prefix}{isFloat ? display.toFixed(1) : Math.floor(display)}{suffix}
    </span>
  )
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-24 bg-[#0a0a0f] relative overflow-hidden">
      {/* Purple glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              <p className="text-sm text-white/40 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
