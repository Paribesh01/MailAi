"use client"

import { signIn } from "@/lib/auth-client"
import { Sparkles, ShieldAlert, Mail, Zap, Edit3 } from "lucide-react"

const MISSING_SCOPE_LABELS = [
  { icon: Mail, label: "Read your emails", desc: "Required to fetch and display your inbox" },
  { icon: Edit3, label: "Send emails", desc: "Required to send AI-drafted replies" },
  { icon: Zap, label: "Modify emails", desc: "Required to mark as read, archive, and star" },
]

export default function ReauthPage() {
  async function handleReauth() {
    await signIn.social({ provider: "google", callbackURL: "/inbox" })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Icon + heading */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coral/10 mb-4">
            <ShieldAlert className="w-7 h-7 text-coral" />
          </div>
          <h1 className="text-2xl font-bold text-espresso tracking-tight">Gmail access needed</h1>
          <p className="mt-2 text-sm text-stone-warm leading-relaxed">
            It looks like some Gmail permissions were not granted during sign-in.
            MailAI needs the following access to work properly:
          </p>
        </div>

        {/* Scope list */}
        <div className="grid gap-3">
          {MISSING_SCOPE_LABELS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3 p-3 rounded-xl border border-taupe bg-white">
              <div className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-coral" />
              </div>
              <div>
                <p className="text-sm font-medium text-espresso">{label}</p>
                <p className="text-xs text-stone-warm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <div className="rounded-xl border border-blue-light bg-blue-light/40 px-4 py-3 text-xs text-slate-blue leading-relaxed">
          <strong>Why all scopes?</strong> On the next screen, make sure to check all the boxes Google shows.
          Without them, actions like syncing, replying, or archiving will fail.
        </div>

        {/* Re-auth button */}
        <button
          onClick={handleReauth}
          className="w-full h-11 rounded-xl bg-espresso text-white font-semibold text-sm hover:bg-espresso/85 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(45,42,38,0.2)]"
        >
          <Sparkles className="w-4 h-4" />
          Re-connect Google — grant all access
        </button>

        <p className="text-center text-xs text-stone-warm/60">
          Your emails are never stored permanently. We only request the minimum access needed.
        </p>
      </div>
    </div>
  )
}
