import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { archiveThread, starThread, deleteThread, markAsRead } from "@/lib/gmail"

export async function GET(_: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const session = await requireSession()
    const { threadId } = await params

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      include: {
        emails: { orderBy: { internalDate: "asc" } },
        labels: { include: { label: true } },
        followUps: { orderBy: { scheduledFor: "asc" } },
      },
    })

    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Mark first unread message as read
    const unreadEmail = thread.emails.find((e) => !e.isRead)
    if (unreadEmail) {
      await Promise.all([
        markAsRead(session.user.id, unreadEmail.gmailMessageId),
        prisma.email.update({ where: { id: unreadEmail.id }, data: { isRead: true } }),
        prisma.thread.update({ where: { id: threadId }, data: { isRead: true } }),
      ])
    }

    return NextResponse.json(thread)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const session = await requireSession()
    const { threadId } = await params
    const body = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates: any = {}

    if (body.isArchived !== undefined) {
      updates.isArchived = body.isArchived
      await archiveThread(session.user.id, thread.gmailThreadId)
    }
    if (body.isStarred !== undefined) {
      updates.isStarred = body.isStarred
      await starThread(session.user.id, thread.gmailThreadId, body.isStarred)
    }
    if (body.isRead !== undefined) updates.isRead = body.isRead
    if (body.category !== undefined) updates.category = body.category
    if (body.isSnoozed !== undefined) {
      updates.isSnoozed = body.isSnoozed
      updates.snoozedUntil = body.snoozedUntil ? new Date(body.snoozedUntil) : null
    }

    const updated = await prisma.thread.update({ where: { id: threadId }, data: updates })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const session = await requireSession()
    const { threadId } = await params

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await deleteThread(session.user.id, thread.gmailThreadId)
    await prisma.thread.delete({ where: { id: threadId } })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
