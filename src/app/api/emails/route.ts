import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"
import { randomBytes } from "crypto"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const archived = searchParams.get("archived") === "true"
    const starred = searchParams.get("starred") === "true"
    const snoozed = searchParams.get("snoozed") === "true"
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "30")

    const where: any = {
      userId: session.user.id,
      isArchived: archived,
    }

    if (category) where.category = category
    if (starred) where.isStarred = true
    if (snoozed) where.isSnoozed = true

    const [threads, total] = await Promise.all([
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
    ])

    return NextResponse.json({ threads, total, page, pages: Math.ceil(total / limit) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { to, subject, html, replyToMessageId, gmailThreadId } = body

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
    })

    // Persist the sent email so the thread panel can show it immediately
    if (gmailThreadId) {
      const thread = await prisma.thread.findFirst({
        where: { gmailThreadId, userId: session.user.id },
      })
      if (thread) {
        const plainText = html.replace(/<[^>]*>/g, "")
        await prisma.email.create({
          data: {
            gmailMessageId: result.id ?? `sent-${Date.now()}`,
            threadId: thread.id,
            from: session.user.email,
            fromName: session.user.name ?? session.user.email,
            to: Array.isArray(to) ? to : [to],
            cc: [],
            bcc: [],
            subject,
            bodyHtml: html,
            bodyText: plainText,
            snippet: plainText.slice(0, 120),
            isRead: true,
            internalDate: new Date(),
            headers: {} as any,
            attachments: [] as any,
          },
        })
        await prisma.thread.update({
          where: { id: thread.id },
          data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
        })
      }
    }

    return NextResponse.json({ messageId: result.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
