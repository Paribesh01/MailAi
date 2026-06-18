import Link from "next/link"
import { Sparkles } from "lucide-react"

const LINKS = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
}

export function Footer() {
  return (
    <footer className="bg-espresso border-t border-white/5 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-xl bg-coral/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-coral" />
              </div>
              <span className="font-bold text-white">MailAI</span>
            </Link>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              AI-powered email management that triages your inbox, drafts replies in your voice, and keeps follow-ups on track.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 text-xs font-bold">
                𝕏
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/40 text-xs font-bold">
                GH
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-3">{group}</p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-white/40 hover:text-white/80 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2026 MailAI. All rights reserved.</p>
          <p className="text-xs text-white/20">
            Built with{" "}
            <span className="text-coral/60">Claude Sonnet</span>
            {" "}·{" "}
            <span className="text-white/30">Next.js 16 · PostgreSQL · Better Auth</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
