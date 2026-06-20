"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Lock, ShieldCheck, EyeOff, Trash2 } from "lucide-react"

const ITEMS = [
  {
    icon: Lock,
    color: "text-slate-blue",
    bg: "bg-blue-light",
    title: "AES-256-GCM Encryption at Rest",
    body: "Every email body stored in our database is encrypted with AES-256-GCM using a unique key derived per user. Even if someone accessed the raw database, they'd see ciphertext — not your mail.",
    tag: "Built and verifiable",
    tagColor: "bg-sage/10 text-sage",
  },
  {
    icon: ShieldCheck,
    color: "text-coral",
    bg: "bg-coral/10",
    title: "Encrypted in Transit",
    body: "All data between your browser, our servers, and Gmail travels over HTTPS/TLS. No email content is ever sent over an unencrypted connection.",
    tag: "Enforced by Vercel",
    tagColor: "bg-coral/10 text-coral",
  },
  {
    icon: EyeOff,
    color: "text-sage",
    bg: "bg-sage/10",
    title: "Your Emails Never Train AI",
    body: "We use Groq's API for AI features. Groq's terms explicitly state that API data is not used to train their models. Your private correspondence stays private.",
    tag: "Groq API policy",
    tagColor: "bg-sage/10 text-sage",
  },
  {
    icon: Trash2,
    color: "text-sand",
    bg: "bg-sand/10",
    title: "You Own Your Data",
    body: "Delete your account at any time and every thread, email, label, and preference tied to you is permanently removed from our database via cascading deletes. No backups, no retention.",
    tag: "Schema-enforced",
    tagColor: "bg-sand/10 text-sand",
  },
]

export function Security() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-28 bg-white border-y border-taupe">
      <div ref={ref} className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-blue/10 text-slate-blue text-xs font-semibold uppercase tracking-widest mb-4"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy & Security
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl md:text-4xl font-bold text-espresso tracking-tight mb-4"
          >
            We say only what we can prove
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.18 }}
            className="text-stone-warm text-lg max-w-xl mx-auto"
          >
            No vague certifications. These are the specific, verifiable protections
            built into MailAI right now.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITEMS.map(({ icon: Icon, color, bg, title, body, tag, tagColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="flex flex-col gap-4 p-6 rounded-2xl bg-cream border border-taupe hover:border-stone-warm/40 hover:shadow-[0_4px_20px_rgba(45,42,38,0.08)] transition-all duration-200"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>

              {/* Text */}
              <div className="flex-1 space-y-2">
                <h3 className="text-[15px] font-semibold text-espresso leading-snug">{title}</h3>
                <p className="text-sm text-stone-warm leading-relaxed">{body}</p>
              </div>

              {/* Verification tag */}
              <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColor}`}>
                {tag}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.55 }}
          className="text-center text-xs text-stone-warm/50 mt-10"
        >
          We will update this section only when a new protection is actually implemented — not as marketing.
        </motion.p>

      </div>
    </section>
  )
}
