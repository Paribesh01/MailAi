"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
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
    <span className="gradient-text">
      {displayed}
      <span className="animate-cursor text-indigo-400">|</span>
    </span>
  )
}

const FLOATING_EMAILS = [
  { label: "Meeting at 3pm", from: "Sarah Chen", badge: "Needs attention", color: "from-red-500/20 to-pink-500/20", border: "border-red-500/20", delay: "0s" },
  { label: "Q4 Report Ready", from: "Analytics Team", badge: "Can wait", color: "from-amber-500/20 to-yellow-500/20", border: "border-amber-500/20", delay: "1.5s" },
  { label: "Newsletter #42", from: "TechCrunch", badge: "Ignore", color: "from-slate-500/10 to-slate-400/10", border: "border-slate-500/20", delay: "0.8s" },
  { label: "AI draft ready ✨", from: "MailAI", badge: "Draft", color: "from-indigo-500/20 to-purple-500/20", border: "border-indigo-500/30", delay: "2.2s" },
]

const BADGE_COLORS: Record<string, string> = {
  "Needs attention": "bg-red-500/20 text-red-400 border border-red-500/30",
  "Can wait":        "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  "Ignore":          "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  "Draft":           "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
}

const CARD_POSITIONS = ["top-0 left-0", "top-0 right-0", "bottom-10 left-4", "bottom-4 right-4"]

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white">
      {/* Background blobs — pure CSS animations, no scroll hooks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[120px] animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-violet-600/15 to-pink-600/15 blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium glass border border-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-3 h-3" />
            AI-powered inbox management
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
        >
          Email doesn&apos;t have to be
          <br />
          <TypewriterWord />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-center text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
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
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 group"
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button
              size="lg"
              variant="ghost"
              className="h-12 px-8 text-base text-white/70 hover:text-white hover:bg-white/5 border border-white/10"
            >
              See how it works
            </Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-white/30 mt-6"
        >
          No credit card required · Free forever for personal use · 2-minute setup
        </motion.p>

        {/* Floating email cards + app mockup */}
        <div className="relative mt-20 h-[380px] w-full max-w-4xl mx-auto">
          {/* Center app mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-16 top-8 bottom-0 rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-pulse-glow"
          >
            <div className="h-full bg-[#111118] flex flex-col">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 mx-4 h-5 rounded bg-white/5 flex items-center px-2">
                  <span className="text-[9px] text-white/30">mailai.app/inbox</span>
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="w-10 border-r border-white/5 flex flex-col items-center gap-3 py-3">
                  {["M", "★", "⏱", "🗂"].map((icon, i) => (
                    <div key={i} className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] ${i === 0 ? "bg-indigo-500/30 text-indigo-400" : "text-white/20"}`}>
                      {icon}
                    </div>
                  ))}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex border-b border-white/5 text-[9px]">
                    <span className="px-3 py-2 text-indigo-400 border-b border-indigo-500">Needs attention</span>
                    <span className="px-3 py-2 text-white/30">Can wait</span>
                    <span className="px-3 py-2 text-white/30">Ignore</span>
                  </div>
                  {[
                    { name: "Sarah Chen", subject: "Q4 Review — need your input", time: "2m", dot: true },
                    { name: "David Park", subject: "Re: Partnership proposal", time: "1h", dot: false },
                    { name: "Investor Update", subject: "Monthly metrics deck", time: "3h", dot: true },
                  ].map((e, i) => (
                    <div key={i} className={`flex gap-2 px-3 py-2 border-b border-white/5 ${i === 0 ? "bg-indigo-500/5" : ""}`}>
                      {e.dot ? <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" /> : <span className="mt-1 w-1.5 h-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <span className="text-[9px] font-semibold text-white/80">{e.name}</span>
                          <span className="text-[9px] text-white/30">{e.time}</span>
                        </div>
                        <p className="text-[8px] text-white/40 truncate">{e.subject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards — CSS float animation only, no framer opacity conflict */}
          {FLOATING_EMAILS.map((email, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
              className={`absolute ${CARD_POSITIONS[i]} w-48`}
            >
              <div
                className={`rounded-xl p-3 bg-gradient-to-br ${email.color} border ${email.border} backdrop-blur-sm shadow-xl animate-float`}
                style={{ animationDelay: email.delay, animationDuration: `${5 + i}s` }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-white/90 leading-tight">{email.label}</span>
                  <Zap className="w-2.5 h-2.5 text-white/30 shrink-0 mt-0.5" />
                </div>
                <p className="text-[9px] text-white/40 mb-2">{email.from}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${BADGE_COLORS[email.badge]}`}>
                  {email.badge}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom fade into the next dark section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </section>
  )
}
