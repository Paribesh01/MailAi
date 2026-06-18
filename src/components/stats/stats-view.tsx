"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart2,
  Inbox,
  Star,
  TrendingUp,
  Users,
  Zap,
  Mail,
  Clock,
} from "lucide-react"
import { ChatAssistant } from "@/components/inbox/chat-assistant"

interface StatsData {
  totalEmails: number
  unreadEmails: number
  starredEmails: number
  todayEmails: number
  categories: {
    NEEDS_ATTENTION: number
    CAN_WAIT: number
    IGNORE: number
  }
  noiseRatio: number
  topSenders: Array<{ email: string; name?: string; count: number }>
  avgDailyEmails: number
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  iconBg,
  iconColor,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  loading: boolean
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-taupe p-5 shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-stone-warm">{title}</p>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 bg-taupe" />
      ) : (
        <div className="text-3xl font-bold tracking-tight text-espresso">{value}</div>
      )}
      {description && (
        <p className="mt-1 text-xs text-stone-warm/70">{description}</p>
      )}
    </div>
  )
}

function CategoryBar({
  label,
  count,
  total,
  barColor,
  labelColor,
  loading,
}: {
  label: string
  count: number
  total: number
  barColor: string
  labelColor: string
  loading: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div className="rounded-2xl bg-white border border-taupe p-5 shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-semibold ${labelColor}`}>{label}</p>
        {loading ? (
          <Skeleton className="h-5 w-10 rounded-full bg-taupe" />
        ) : (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${labelColor} bg-current/10`}
            style={{ backgroundColor: "transparent", border: "1px solid currentColor", opacity: 1 }}
          >
            <span style={{ opacity: 1 }}>{pct}%</span>
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-20 bg-taupe" />
          <Skeleton className="h-2 w-full rounded-full bg-taupe" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-espresso mb-3">{count.toLocaleString()}</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-taupe">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-stone-warm mt-2">
            {count.toLocaleString()} of {total.toLocaleString()} emails
          </p>
        </>
      )}
    </div>
  )
}

export function StatsView() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats")
        if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const totalCategorized = data?.categories
    ? (data.categories.NEEDS_ATTENTION ?? 0) +
      (data.categories.CAN_WAIT ?? 0) +
      (data.categories.IGNORE ?? 0)
    : 0

  return (
    <div className="min-h-full bg-cream overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-blue/10 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-slate-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-espresso">Inbox Intelligence</h1>
            <p className="text-sm text-stone-warm">A breakdown of your email activity and noise patterns</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-coral/20 bg-coral-light px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* Overview stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Emails" value={data?.totalEmails.toLocaleString() ?? "—"} icon={Inbox} description="All time in your mailbox" loading={loading} iconBg="bg-slate-blue/10" iconColor="text-slate-blue" />
          <StatCard title="Unread" value={data?.unreadEmails.toLocaleString() ?? "—"} icon={Mail} description="Waiting for your attention" loading={loading} iconBg="bg-coral/10" iconColor="text-coral" />
          <StatCard title="Starred" value={data?.starredEmails.toLocaleString() ?? "—"} icon={Star} description="Flagged as important" loading={loading} iconBg="bg-sand/15" iconColor="text-sand" />
          <StatCard title="Today" value={data?.todayEmails.toLocaleString() ?? "—"} icon={Clock} description="Received in last 24 hours" loading={loading} iconBg="bg-sage/10" iconColor="text-sage" />
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-espresso">
            <Zap className="h-4 w-4 text-coral" />
            Category Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <CategoryBar label="Needs Attention" count={data?.categories?.NEEDS_ATTENTION ?? 0} total={totalCategorized} barColor="bg-coral" labelColor="text-coral" loading={loading} />
            <CategoryBar label="Can Wait" count={data?.categories?.CAN_WAIT ?? 0} total={totalCategorized} barColor="bg-sand" labelColor="text-sand" loading={loading} />
            <CategoryBar label="Ignore" count={data?.categories?.IGNORE ?? 0} total={totalCategorized} barColor="bg-stone-warm" labelColor="text-stone-warm" loading={loading} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Noise ratio */}
          <div className="rounded-2xl bg-white border border-taupe p-5 shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-coral" />
              <p className="text-sm font-semibold text-espresso">Noise Ratio</p>
            </div>
            <p className="text-xs text-stone-warm mb-4">Percentage of low-value or ignorable email</p>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-28 bg-taupe" />
                <Skeleton className="h-2 w-full rounded-full bg-taupe" />
              </div>
            ) : (
              <>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-5xl font-black leading-none text-coral">{data?.noiseRatio ?? 0}</span>
                  <span className="mb-1 text-xl font-bold text-coral/60">%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-taupe">
                  <div className="h-full rounded-full bg-coral transition-all duration-700" style={{ width: `${data?.noiseRatio ?? 0}%` }} />
                </div>
                <p className="text-xs text-stone-warm mt-2">
                  {(data?.noiseRatio ?? 0) > 60
                    ? "Your inbox is dominated by noise. Consider aggressive filters."
                    : (data?.noiseRatio ?? 0) > 30
                    ? "A moderate amount of noise — some cleanup could help."
                    : "Your inbox is mostly signal. Well done!"}
                </p>
              </>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 lg:col-span-2">

            {/* Avg daily */}
            <div className="rounded-2xl bg-white border border-taupe p-5 shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-stone-warm">Avg Daily Emails</p>
                <div className="w-8 h-8 rounded-lg bg-slate-blue/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-slate-blue" />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-24 bg-taupe" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-espresso">{data?.avgDailyEmails ?? 0}</div>
                  <p className="text-xs text-stone-warm mt-1">emails per day on average</p>
                </>
              )}
            </div>

            {/* Top senders */}
            <div className="flex-1 rounded-2xl bg-white border border-taupe p-5 shadow-[0_1px_4px_rgba(45,42,38,0.06)]">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-slate-blue" />
                <p className="text-sm font-semibold text-espresso">Top Senders</p>
              </div>
              <p className="text-xs text-stone-warm mb-4">Who fills your inbox the most</p>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-40 bg-taupe" />
                      <Skeleton className="h-5 w-10 rounded-full bg-taupe" />
                    </div>
                  ))}
                </div>
              ) : !data?.topSenders?.length ? (
                <p className="text-xs text-stone-warm">No sender data available.</p>
              ) : (
                <ol className="space-y-1.5">
                  {data.topSenders.slice(0, 8).map((sender, idx) => (
                    <li key={sender.email} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-cream transition-colors">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          idx === 0 ? "bg-sand-light text-sand" :
                          idx === 1 ? "bg-taupe text-stone-warm" :
                          idx === 2 ? "bg-coral-light text-coral" :
                          "bg-cream text-stone-warm/60"
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          {sender.name && (
                            <p className="truncate text-xs font-medium text-espresso leading-tight">{sender.name}</p>
                          )}
                          <p className="truncate text-xs text-stone-warm">{sender.email}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-light text-slate-blue">
                        {sender.count}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChatAssistant />
    </div>
  )
}
