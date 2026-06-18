import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession()
    const userId = session.user.id

    const now = new Date()

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch all threads for the user with only the fields we need
    const threads = await prisma.thread.findMany({
      where: { userId },
      select: {
        id: true,
        category: true,
        isRead: true,
        isStarred: true,
        isArchived: true,
        lastMessageAt: true,
        participantEmails: true,
      },
    })

    const totalThreads = threads.length

    // Category counts
    const byCategory = {
      NEEDS_ATTENTION: 0,
      CAN_WAIT: 0,
      IGNORE: 0,
    }
    for (const t of threads) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + 1
    }

    // Unread, starred, archived counts
    const unreadCount = threads.filter((t) => !t.isRead).length
    const starredCount = threads.filter((t) => t.isStarred).length
    const archivedCount = threads.filter((t) => t.isArchived).length

    // Today and week counts based on lastMessageAt
    const todayCount = threads.filter(
      (t) => t.lastMessageAt >= startOfToday
    ).length
    const weekCount = threads.filter(
      (t) => t.lastMessageAt >= sevenDaysAgo
    ).length

    // Top senders: aggregate by first participantEmail across all threads
    const senderCounts: Record<string, number> = {}
    for (const t of threads) {
      for (const email of t.participantEmails) {
        if (!email) continue
        const normalized = email.toLowerCase().trim()
        senderCounts[normalized] = (senderCounts[normalized] ?? 0) + 1
      }
    }

    const topSenders = Object.entries(senderCounts)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Noise ratio: percentage of IGNORE threads
    const noiseRatio =
      totalThreads > 0
        ? Math.round((byCategory.IGNORE / totalThreads) * 100 * 100) / 100
        : 0

    // Average daily emails estimate over 30 days
    const avgDailyEmails =
      Math.round((totalThreads / 30) * 100) / 100

    return NextResponse.json({
      totalEmails: totalThreads,
      categories: byCategory,
      unreadEmails: unreadCount,
      starredEmails: starredCount,
      todayEmails: todayCount,
      topSenders,
      noiseRatio,
      avgDailyEmails,
    })
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[stats] GET error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
