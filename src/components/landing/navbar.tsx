"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-white/90 backdrop-blur-md border-b border-taupe shadow-[0_1px_8px_rgba(45,42,38,0.06)]"
          : "py-5 bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Sparkles className="w-4 h-4 text-coral" />
          </div>
          <span className="font-bold text-lg tracking-tight text-espresso">MailAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm text-stone-warm hover:text-espresso transition-colors rounded-lg hover:bg-sand-light/50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-sm font-medium text-stone-warm hover:text-espresso transition-colors">
              Sign in
            </button>
          </Link>
          <Link href="/login">
            <button className="h-9 px-5 rounded-[10px] bg-espresso text-white text-sm font-semibold hover:bg-espresso/85 transition-colors shadow-[0_2px_8px_rgba(45,42,38,0.2)]">
              Get started free
            </button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-sand-light/50 transition-colors text-stone-warm"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-taupe bg-white"
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 text-sm text-stone-warm rounded-lg hover:bg-sand-light/50 hover:text-espresso transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-taupe mt-2 pt-4 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <button className="w-full text-left px-3 py-2.5 text-sm text-stone-warm hover:text-espresso">Sign in</button>
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <button className="w-full h-10 rounded-[10px] bg-espresso text-white text-sm font-semibold">
                    Get started free
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
