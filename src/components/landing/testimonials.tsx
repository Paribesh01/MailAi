"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Star } from "lucide-react"

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Founder, Meridian Labs",
    avatar: "SC",
    avatarClass: "bg-coral-light text-coral",
    quote: "MailAI cut my inbox time from 2 hours to 20 minutes a day. The AI drafts sound exactly like me — my team can't even tell the difference.",
    stars: 5,
  },
  {
    name: "Marcus Webb",
    role: "VP Sales, Vertex AI",
    avatar: "MW",
    avatarClass: "bg-sage-light text-sage",
    quote: "The follow-up scheduler alone is worth it. I used to let 30% of leads go cold just because I forgot to follow up. That number is now zero.",
    stars: 5,
  },
  {
    name: "Priya Nair",
    role: "Engineering Manager, Stripe",
    avatar: "PN",
    avatarClass: "bg-blue-light text-slate-blue",
    quote: "The noise filter is incredible. I get 200+ emails a day. MailAI surfaces maybe 20 that actually need me. The rest just disappear.",
    stars: 5,
  },
  {
    name: "David Okafor",
    role: "Partner, Sequoia Capital",
    avatar: "DO",
    avatarClass: "bg-sand-light text-sand",
    quote: "I was skeptical about AI in my inbox. Two weeks in and I can't imagine going back. The triage accuracy is genuinely impressive.",
    stars: 5,
  },
  {
    name: "Lena Fischer",
    role: "Head of Operations, Typeform",
    avatar: "LF",
    avatarClass: "bg-coral-light text-coral",
    quote: "Thread summarization is my favourite feature. I joined a company mid-conversation on every project. MailAI caught me up instantly.",
    stars: 5,
  },
  {
    name: "Tom Bradley",
    role: "CEO, Linear",
    avatar: "TB",
    avatarClass: "bg-sage-light text-sage",
    quote: "We shipped MailAI to our whole leadership team. Average inbox zero time dropped from 3.5 hours to 45 minutes per person. ROI in day one.",
    stars: 5,
  },
]

function TestimonialCard({ testimonial: t, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: (index % 3) * 0.1, duration: 0.6 }}
      className="break-inside-avoid rounded-2xl p-5 bg-white border border-taupe hover:border-tan hover:shadow-[0_4px_16px_rgba(45,42,38,0.08)] transition-all duration-300"
    >
      <div className="flex gap-1 mb-3">
        {Array.from({ length: t.stars }).map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-sand text-sand" />
        ))}
      </div>
      <p className="text-sm text-stone-warm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${t.avatarClass} flex items-center justify-center text-[10px] font-bold shrink-0`}>
          {t.avatar}
        </div>
        <div>
          <p className="text-xs font-semibold text-espresso">{t.name}</p>
          <p className="text-[10px] text-stone-warm/70">{t.role}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function Testimonials() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="py-32 bg-cream relative">
      <div className="max-w-6xl mx-auto px-6 relative">
        <div ref={ref} className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="inline-block text-xs font-semibold tracking-widest uppercase text-coral mb-4"
          >
            Loved by teams
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-espresso tracking-tight"
          >
            Don&apos;t take our{" "}
            <span className="text-coral">word for it</span>
          </motion.h2>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
