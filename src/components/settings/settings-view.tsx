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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sun, Moon, Monitor, Sparkles, Bell, Mail, FileText, ShieldCheck, Trash2, Plus } from "lucide-react"

interface SettingsViewProps {
  user: { id: string; name: string; email: string; image?: string | null }
}

interface Template {
  id: string
  name: string
  body: string
  shortcut?: string | null
}

interface SenderRule {
  id: string
  pattern: string
  action: "NEEDS_ATTENTION" | "CAN_WAIT" | "IGNORE"
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

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [newTemplate, setNewTemplate] = useState({ name: "", body: "", shortcut: "" })
  const [addingTemplate, setAddingTemplate] = useState(false)

  // Sender Rules state
  const [senderRules, setSenderRules] = useState<SenderRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [newRule, setNewRule] = useState({ pattern: "", action: "NEEDS_ATTENTION" as SenderRule["action"] })
  const [addingRule, setAddingRule] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setPrefs((p) => ({ ...p, ...data })))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(Array.isArray(data) ? data : data.templates ?? []))
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => setTemplatesLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/sender-rules")
      .then((r) => r.json())
      .then((data) => setSenderRules(Array.isArray(data) ? data : data.rules ?? []))
      .catch(() => toast.error("Failed to load sender rules"))
      .finally(() => setRulesLoading(false))
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

  async function createTemplate() {
    if (!newTemplate.name.trim() || !newTemplate.body.trim()) return
    setAddingTemplate(true)
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplate.name.trim(),
          body: newTemplate.body.trim(),
          shortcut: newTemplate.shortcut.trim() || null,
        }),
      })
      if (!res.ok) throw new Error()
      const created: Template = await res.json()
      setTemplates((prev) => [...prev, created])
      setNewTemplate({ name: "", body: "", shortcut: "" })
      toast.success("Template added")
    } catch {
      toast.error("Failed to add template")
    } finally {
      setAddingTemplate(false)
    }
  }

  async function deleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template deleted")
    } catch {
      toast.error("Failed to delete template")
    }
  }

  async function createSenderRule() {
    if (!newRule.pattern.trim()) return
    setAddingRule(true)
    try {
      const res = await fetch("/api/sender-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: newRule.pattern.trim(), action: newRule.action }),
      })
      if (!res.ok) throw new Error()
      const created: SenderRule = await res.json()
      setSenderRules((prev) => [...prev, created])
      setNewRule({ pattern: "", action: "NEEDS_ATTENTION" })
      toast.success("Rule added")
    } catch {
      toast.error("Failed to add rule")
    } finally {
      setAddingRule(false)
    }
  }

  async function deleteSenderRule(id: string) {
    try {
      const res = await fetch(`/api/sender-rules/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setSenderRules((prev) => prev.filter((r) => r.id !== id))
      toast.success("Rule deleted")
    } catch {
      toast.error("Failed to delete rule")
    }
  }

  const ACTION_LABELS: Record<SenderRule["action"], string> = {
    NEEDS_ATTENTION: "Needs Attention",
    CAN_WAIT: "Can Wait",
    IGNORE: "Ignore",
  }

  const ACTION_BADGE_VARIANT: Record<SenderRule["action"], "default" | "secondary" | "outline"> = {
    NEEDS_ATTENTION: "default",
    CAN_WAIT: "secondary",
    IGNORE: "outline",
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

        <Separator />

        {/* Templates */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Email Templates
          </h2>
          <p className="text-sm text-muted-foreground">
            Save reusable email templates. Optionally assign a shortcut to quickly insert them.
          </p>

          {templatesLoading ? (
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No templates yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{tpl.name}</span>
                      {tpl.shortcut && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {tpl.shortcut}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => deleteTemplate(tpl.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add template</p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Follow-up"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Body</Label>
                <Textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Template content..."
                  className="mt-1 resize-none text-sm"
                  rows={4}
                />
              </div>
              <div>
                <Label className="text-xs">Shortcut <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={newTemplate.shortcut}
                  onChange={(e) => setNewTemplate((p) => ({ ...p, shortcut: e.target.value }))}
                  placeholder="e.g. /followup"
                  className="mt-1 text-sm font-mono"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={createTemplate}
              disabled={addingTemplate || !newTemplate.name.trim() || !newTemplate.body.trim()}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {addingTemplate ? "Adding..." : "Add template"}
            </Button>
          </div>
        </section>

        <Separator />

        {/* Sender Rules */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Sender Rules
          </h2>
          <p className="text-sm text-muted-foreground">
            Automatically categorize emails based on sender patterns (e.g. a domain, name, or email address).
          </p>

          {rulesLoading ? (
            <p className="text-sm text-muted-foreground">Loading rules...</p>
          ) : senderRules.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No rules yet.</p>
          ) : (
            <div className="space-y-2">
              {senderRules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-sm">
                      Emails from{" "}
                      <span className="font-mono font-medium text-foreground">{rule.pattern}</span>
                    </span>
                    <span className="text-muted-foreground text-sm">&#8594;</span>
                    <Badge variant={ACTION_BADGE_VARIANT[rule.action]}>
                      {ACTION_LABELS[rule.action]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => deleteSenderRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add rule</p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Pattern</Label>
                <Input
                  value={newRule.pattern}
                  onChange={(e) => setNewRule((p) => ({ ...p, pattern: e.target.value }))}
                  placeholder="e.g. @newsletter.com or boss@company.com"
                  className="mt-1 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Action</Label>
                <Select
                  value={newRule.action}
                  onValueChange={(v) => setNewRule((p) => ({ ...p, action: v as SenderRule["action"] }))}
                >
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEEDS_ATTENTION">Needs Attention</SelectItem>
                    <SelectItem value="CAN_WAIT">Can Wait</SelectItem>
                    <SelectItem value="IGNORE">Ignore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              onClick={createSenderRule}
              disabled={addingRule || !newRule.pattern.trim()}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {addingRule ? "Adding..." : "Add rule"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
