"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
  loading: boolean
}) {
  return (
    <Card className="relative overflow-hidden border border-indigo-500/20 bg-card shadow-md before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-indigo-500/5 before:to-purple-500/5 before:pointer-events-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-indigo-500/10 p-2">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryCard({
  label,
  count,
  total,
  color,
  bgColor,
  barColor,
  loading,
}: {
  label: string
  count: number
  total: number
  color: string
  bgColor: string
  barColor: string
  loading: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <Card className={`border ${bgColor} shadow-sm`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-sm font-semibold ${color}`}>
            {label}
          </CardTitle>
          {loading ? (
            <Skeleton className="h-5 w-12 rounded-full" />
          ) : (
            <Badge variant="outline" className={`text-xs font-bold ${color} border-current`}>
              {pct}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-2 w-full rounded-full" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{count.toLocaleString()}</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {count.toLocaleString()} of {total.toLocaleString()} emails
            </p>
          </>
        )}
      </CardContent>
    </Card>
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

  const totalCategorized = data
    ? (data.categories.NEEDS_ATTENTION ?? 0) +
      (data.categories.CAN_WAIT ?? 0) +
      (data.categories.IGNORE ?? 0)
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/25">
              <BarChart2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
              Inbox Intelligence
            </h1>
          </div>
          <p className="pl-1 text-sm text-muted-foreground">
            A breakdown of your email activity and noise patterns
          </p>
        </div>

        {error && (
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="py-4 text-sm text-rose-400">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Overview stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Emails"
            value={data?.totalEmails.toLocaleString() ?? "—"}
            icon={Inbox}
            description="All time in your mailbox"
            loading={loading}
          />
          <StatCard
            title="Unread"
            value={data?.unreadEmails.toLocaleString() ?? "—"}
            icon={Mail}
            description="Waiting for your attention"
            loading={loading}
          />
          <StatCard
            title="Starred"
            value={data?.starredEmails.toLocaleString() ?? "—"}
            icon={Star}
            description="Flagged as important"
            loading={loading}
          />
          <StatCard
            title="Today's Emails"
            value={data?.todayEmails.toLocaleString() ?? "—"}
            icon={Clock}
            description="Received in the last 24 hours"
            loading={loading}
          />
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Zap className="h-4 w-4 text-amber-400" />
            Category Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <CategoryCard
              label="NEEDS ATTENTION"
              count={data?.categories.NEEDS_ATTENTION ?? 0}
              total={totalCategorized}
              color="text-rose-400"
              bgColor="border-rose-500/20 bg-rose-500/5"
              barColor="bg-rose-500"
              loading={loading}
            />
            <CategoryCard
              label="CAN WAIT"
              count={data?.categories.CAN_WAIT ?? 0}
              total={totalCategorized}
              color="text-amber-400"
              bgColor="border-amber-500/20 bg-amber-500/5"
              barColor="bg-amber-400"
              loading={loading}
            />
            <CategoryCard
              label="IGNORE"
              count={data?.categories.IGNORE ?? 0}
              total={totalCategorized}
              color="text-slate-400"
              bgColor="border-slate-500/20 bg-slate-500/5"
              barColor="bg-slate-500"
              loading={loading}
            />
          </div>
        </div>

        {/* Noise ratio + Avg daily + Top senders */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Noise ratio */}
          <Card className="border border-slate-500/20 bg-card shadow-md lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-rose-400" />
                Noise Ratio
              </CardTitle>
              <CardDescription className="text-xs">
                Percentage of your inbox that is low-value or ignorable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-20 w-32" />
                  <Skeleton className="h-4 w-full" />
                </>
              ) : (
                <>
                  <div className="flex items-end gap-1">
                    <span className="text-6xl font-black leading-none tracking-tighter text-rose-400">
                      {data?.noiseRatio ?? 0}
                    </span>
                    <span className="mb-1 text-2xl font-bold text-rose-400/70">%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-700"
                      style={{ width: `${data?.noiseRatio ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(data?.noiseRatio ?? 0) > 60
                      ? "Your inbox is dominated by noise. Consider aggressive filters."
                      : (data?.noiseRatio ?? 0) > 30
                      ? "A moderate amount of noise — some cleanup could help."
                      : "Your inbox is mostly signal. Well done!"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Avg daily + Top senders stacked */}
          <div className="flex flex-col gap-4 lg:col-span-2">

            {/* Avg daily emails */}
            <Card className="border border-indigo-500/20 bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Daily Emails
                </CardTitle>
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-3xl font-bold tracking-tight">
                      {data?.avgDailyEmails ?? 0}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      emails per day on average
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top senders */}
            <Card className="flex-1 border border-purple-500/20 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-purple-400" />
                  Top Senders
                </CardTitle>
                <CardDescription className="text-xs">
                  Who fills your inbox the most
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : !data?.topSenders?.length ? (
                  <p className="text-xs text-muted-foreground">No sender data available.</p>
                ) : (
                  <ol className="space-y-2">
                    {data.topSenders.slice(0, 8).map((sender, idx) => (
                      <li
                        key={sender.email}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              idx === 0
                                ? "bg-amber-400/20 text-amber-400"
                                : idx === 1
                                ? "bg-slate-400/20 text-slate-300"
                                : idx === 2
                                ? "bg-orange-700/20 text-orange-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            {sender.name && (
                              <p className="truncate text-xs font-medium leading-tight">
                                {sender.name}
                              </p>
                            )}
                            <p className="truncate text-xs text-muted-foreground">
                              {sender.email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                        >
                          {sender.count}
                        </Badge>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
