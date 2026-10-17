import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"
import { randomBytes } from "crypto"
import { encrypt, decryptThread } from "@/lib/crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const archived = searchParams.get("archived") === "true"
    const starred = searchParams.get("starred") === "true"
    const snoozed = searchParams.get("snoozed") === "true"
    const followups = searchParams.get("followups") === "true"
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "30") || 30))

    const where: any = {
      userId: session.user.id,
      isArchived: archived,
    }

    if (category) where.category = category
    if (starred) where.isStarred = true
    if (followups) where.hasFollowUp = true
    if (snoozed) {
      where.isSnoozed = true
    } else if (!archived) {
      // Auto-unsnooze emails whose snoozedUntil has passed
      await prisma.thread.updateMany({
        where: {
          userId: session.user.id,
          isSnoozed: true,
          snoozedUntil: { lte: new Date() },
        },
        data: { isSnoozed: false, snoozedUntil: null },
      })
      // Never show snoozed threads in normal inbox view
      where.isSnoozed = false
    }

    const [threads, total, unreadByCategory] = await Promise.all([
      prisma.thread.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          labels: { include: { label: true } },
          followUps: { where: { isDone: false }, orderBy: { scheduledFor: "asc" } },
          _count: { select: { emails: true } },
        },
      }),
      prisma.thread.count({ where }),
      // Unread counts for the inbox tab badges
      prisma.thread.groupBy({
        by: ["category"],
        where: { userId: session.user.id, isArchived: false, isSnoozed: false, isRead: false },
        _count: { _all: true },
      }),
    ])

    const counts: Record<string, number> = { ALL: 0 }
    for (const row of unreadByCategory) {
      counts[row.category] = row._count._all
      counts.ALL += row._count._all
    }

    return NextResponse.json({
      threads: threads.map((t) => decryptThread(t, session.user.id)),
      total,
      page,
      pages: Math.ceil(total / limit),
      counts,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { to, subject, html, replyToMessageId, gmailThreadId } = body
    if (!to || (Array.isArray(to) && to.length === 0) || typeof html !== "string") {
      return NextResponse.json({ error: "Recipient and message body are required" }, { status: 400 })
    }

    // Replies go out from the mailbox the thread belongs to
    const thread = gmailThreadId
      ? await prisma.thread.findFirst({ where: { gmailThreadId, userId: session.user.id } })
      : null

    // Inject read-receipt tracking pixel (only for new threads, not replies)
    let trackedHtml = html
    if (!replyToMessageId) {
      const trackingId = randomBytes(16).toString("hex")
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      trackedHtml += `<img src="${appUrl}/api/track/open/${trackingId}" width="1" height="1" alt="" style="display:none"/>`
      await prisma.emailTrack.create({
        data: {
          userId: session.user.id,
          trackingId,
          toEmail: Array.isArray(to) ? to[0] : to,
          subject,
        },
      })
    }

    const result = await sendEmail(session.user.id, {
      to,
      subject,
      body: trackedHtml,
      replyToMessageId,
      threadId: gmailThreadId,
      accountEmail: thread?.accountEmail,
    })

    // Persist the sent email so the thread panel can show it immediately
    if (thread) {
      const userId = session.user.id
      const plainText = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim()
      const snippet = plainText.replace(/\s+/g, " ").slice(0, 120)
      await prisma.email.create({
        data: {
          gmailMessageId: result.id ?? `sent-${Date.now()}`,
          threadId: thread.id,
          from: thread.accountEmail ?? session.user.email,
          fromName: session.user.name ?? session.user.email,
          to: Array.isArray(to) ? to : [to],
          cc: [],
          bcc: [],
          subject,
          bodyHtml: encrypt(html, userId),
          bodyText: encrypt(plainText, userId),
          snippet: encrypt(snippet, userId),
          isRead: true,
          isSent: true,
          internalDate: new Date(),
          headers: {},
          attachments: [],
        },
      })
      await prisma.thread.update({
        where: { id: thread.id },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
          snippet: encrypt(snippet, userId),
        },
      })
    }

    return NextResponse.json({ messageId: result.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
