"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Sun, Moon, Monitor, Sparkles, Bell, Mail } from "lucide-react"

interface SettingsViewProps {
  user: { name: string; email: string; image?: string | null }
}

interface Prefs {
  theme: string
  emailSignature: string
  autoFollowUpDays: number
  notifyOnNewEmail: boolean
  dailyDigest: boolean
  aiVoiceSamples: string[]
}

export function SettingsView({ user }: SettingsViewProps) {
  const { setTheme, theme } = useTheme()
  const [prefs, setPrefs] = useState<Prefs>({
    theme: "system",
    emailSignature: "",
    autoFollowUpDays: 3,
    notifyOnNewEmail: true,
    dailyDigest: false,
    aiVoiceSamples: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [voiceSample, setVoiceSample] = useState("")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setPrefs((p) => ({ ...p, ...data })))
      .finally(() => setLoading(false))
  }, [])

  async function save(updates: Partial<Prefs>) {
    setSaving(true)
    const next = { ...prefs, ...updates }
    setPrefs(next)
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  function addVoiceSample() {
    if (!voiceSample.trim()) return
    const next = [...(prefs.aiVoiceSamples ?? []), voiceSample.trim()]
    setVoiceSample("")
    save({ aiVoiceSamples: next })
  }

  function removeVoiceSample(i: number) {
    const next = prefs.aiVoiceSamples.filter((_, idx) => idx !== i)
    save({ aiVoiceSamples: next })
  }

  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  if (loading) return null

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" /> Account
          </h2>
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-card">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Appearance */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Sun className="w-3.5 h-3.5" /> Appearance
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); save({ theme: value }) }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                  (theme ?? "system") === value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <Separator />

        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Bell className="w-3.5 h-3.5" /> Notifications & Follow-ups
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Notify on new emails</p>
                <p className="text-xs text-muted-foreground">Get alerted when new mail arrives</p>
              </div>
              <Switch
                checked={prefs.notifyOnNewEmail}
                onCheckedChange={(v) => save({ notifyOnNewEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Daily digest</p>
                <p className="text-xs text-muted-foreground">Morning summary of your inbox</p>
              </div>
              <Switch
                checked={prefs.dailyDigest}
                onCheckedChange={(v) => save({ dailyDigest: v })}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-1">
                <p className="text-sm font-medium">Auto follow-up after</p>
                <p className="text-xs text-muted-foreground">AI will suggest a follow-up after this many days of silence</p>
              </div>
              <Select
                value={String(prefs.autoFollowUpDays)}
                onValueChange={(v) => save({ autoFollowUpDays: Number(v) })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 7, 14].map((d) => (
                    <SelectItem key={d} value={String(d)}>{d} days</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <Separator />

        {/* AI Voice */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Voice Training
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste examples of emails you've written. Claude will mimic your style when drafting replies.
          </p>
          <div className="space-y-2">
            {(prefs.aiVoiceSamples ?? []).map((sample, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 p-3 rounded-lg border text-sm text-muted-foreground line-clamp-2">
                  {sample}
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeVoiceSample(i)} className="shrink-0 text-destructive">
                  Remove
                </Button>
              </div>
            ))}
            <Textarea
              value={voiceSample}
              onChange={(e) => setVoiceSample(e.target.value)}
              placeholder="Paste an email you've written..."
              className="resize-none text-sm"
              rows={4}
            />
            <Button variant="outline" size="sm" onClick={addVoiceSample} disabled={!voiceSample.trim()}>
              Add sample
            </Button>
          </div>
        </section>

        <Separator />

        {/* Signature */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Email Signature
          </h2>
          <Textarea
            value={prefs.emailSignature ?? ""}
            onChange={(e) => setPrefs((p) => ({ ...p, emailSignature: e.target.value }))}
            onBlur={() => save({ emailSignature: prefs.emailSignature })}
            placeholder="Your email signature..."
            className="resize-none text-sm"
            rows={4}
          />
        </section>
      </div>
    </div>
  )
}
