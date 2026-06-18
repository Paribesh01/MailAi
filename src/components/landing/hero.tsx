"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Zap } from "lucide-react"

const WORDS = ["cluttered.", "overwhelming.", "endless.", "chaotic."]

function TypewriterWord() {
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = WORDS[index]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed === word) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && displayed === "") {
      setDeleting(false)
      setIndex((i) => (i + 1) % WORDS.length)
    } else if (deleting) {
      timeout = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 60)
    } else {
      timeout = setTimeout(() => setDisplayed((d) => word.slice(0, d.length + 1)), 100)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, index])

  return (
    <span className="text-coral">
      {displayed}
      <span className="animate-cursor text-coral/60">|</span>
    </span>
  )
}

const FLOATING_EMAILS = [
  { label: "Meeting at 3pm", from: "Sarah Chen", badge: "Needs attention", bg: "bg-coral-light", border: "border-coral/20", badgeClass: "bg-coral/15 text-coral", delay: "0s" },
  { label: "Q4 Report Ready", from: "Analytics Team", badge: "Can wait", bg: "bg-sage-light", border: "border-sage/20", badgeClass: "bg-sage/15 text-sage", delay: "1.5s" },
  { label: "Newsletter #42", from: "TechCrunch", badge: "Ignore", bg: "bg-taupe", border: "border-tan/40", badgeClass: "bg-tan text-stone-warm", delay: "0.8s" },
  { label: "AI draft ready ✨", from: "MailAI", badge: "Draft", bg: "bg-blue-light", border: "border-slate-blue/20", badgeClass: "bg-slate-blue/15 text-slate-blue", delay: "2.2s" },
]

const CARD_POSITIONS = ["top-0 left-0", "top-0 right-0", "bottom-10 left-4", "bottom-4 right-4"]

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-cream">
      {/* Subtle background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-coral/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-sage/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sand/8 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-coral/10 border border-coral/20 text-coral">
            <Sparkles className="w-3 h-3" />
            AI-powered inbox management
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6 text-espresso"
        >
          Email doesn&apos;t have to be
          <br />
          <TypewriterWord />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-center text-lg md:text-xl text-stone-warm max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          MailAI splits your inbox into what needs attention, what can wait, and
          what to ignore — then drafts replies in your voice.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/login">
            <button className="h-12 px-8 text-base rounded-xl bg-espresso text-white font-semibold shadow-[0_4px_16px_rgba(45,42,38,0.25)] hover:bg-espresso/85 transition-all duration-200 flex items-center gap-2 group">
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="h-12 px-8 text-base rounded-xl border border-taupe text-stone-warm hover:border-stone-warm hover:text-espresso hover:bg-sand-light/30 transition-all duration-200">
              See how it works
            </button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-stone-warm/60 mt-6"
        >
          No credit card required · Free forever for personal use · 2-minute setup
        </motion.p>

        {/* App mockup + floating cards */}
        <div className="relative mt-20 h-[380px] w-full max-w-4xl mx-auto">
          {/* Center app mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-16 top-8 bottom-0 rounded-2xl overflow-hidden border border-taupe shadow-[0_8px_32px_rgba(45,42,38,0.12)]"
          >
            <div className="h-full bg-cream flex flex-col">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-taupe bg-white">
                <div className="w-3 h-3 rounded-full bg-coral/40" />
                <div className="w-3 h-3 rounded-full bg-sand/60" />
                <div className="w-3 h-3 rounded-full bg-sage/40" />
                <div className="flex-1 mx-4 h-5 rounded-lg bg-taupe flex items-center px-2">
                  <span className="text-[9px] text-stone-warm/60">mailai.app/inbox</span>
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-10 border-r border-taupe flex flex-col items-center gap-3 py-3 bg-cream">
                  <div className="w-6 h-6 rounded-lg bg-coral/10 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-coral" />
                  </div>
                  {["✉", "★", "⏱", "📊"].map((icon, i) => (
                    <div key={i} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${i === 0 ? "bg-sand-light text-espresso" : "text-stone-warm/40"}`}>
                      {icon}
                    </div>
                  ))}
                </div>
                {/* Email list */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex border-b border-taupe px-2 gap-1 py-1.5">
                    <span className="px-2 py-1 text-[9px] bg-white rounded-lg shadow-[0_1px_3px_rgba(45,42,38,0.06)] text-espresso font-medium">Needs attention <span className="text-[8px] bg-coral-light text-coral px-1 py-0.5 rounded-full ml-1">5</span></span>
                    <span className="px-2 py-1 text-[9px] text-stone-warm">Can wait</span>
                    <span className="px-2 py-1 text-[9px] text-stone-warm">Ignore</span>
                  </div>
                  <div className="px-2 py-2 flex flex-col gap-1.5">
                    {[
                      { name: "Sarah Chen", subject: "Q4 Review — need your input", time: "2m", unread: true },
                      { name: "David Park", subject: "Re: Partnership proposal", time: "1h", unread: false },
                      { name: "Investor Update", subject: "Monthly metrics deck", time: "3h", unread: true },
                    ].map((e, i) => (
                      <div key={i} className={`flex gap-2 px-2 py-1.5 rounded-lg ${i === 0 ? "bg-white shadow-[0_1px_3px_rgba(45,42,38,0.06)] border-l-2 border-coral" : "border-l-2 border-transparent"}`}>
                        {e.unread ? <span className="mt-1.5 w-1 h-1 rounded-full bg-coral shrink-0" /> : <span className="mt-1.5 w-1 h-1 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <span className="text-[9px] font-semibold text-espresso">{e.name}</span>
                            <span className="text-[8px] text-stone-warm">{e.time}</span>
                          </div>
                          <p className="text-[8px] text-stone-warm truncate">{e.subject}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards */}
          {FLOATING_EMAILS.map((email, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
              className={`absolute ${CARD_POSITIONS[i]} w-48`}
            >
              <div
                className={`rounded-xl p-3 ${email.bg} border ${email.border} shadow-[0_4px_12px_rgba(45,42,38,0.1)] animate-float`}
                style={{ animationDelay: email.delay, animationDuration: `${5 + i}s` }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-espresso leading-tight">{email.label}</span>
                  <Zap className="w-2.5 h-2.5 text-stone-warm/30 shrink-0 mt-0.5" />
                </div>
                <p className="text-[9px] text-stone-warm mb-2">{email.from}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${email.badgeClass}`}>
                  {email.badge}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
    </section>
  )
}
