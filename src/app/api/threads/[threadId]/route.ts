import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { archiveThread, starThread, deleteThread, markAsRead, setThreadRead, fetchThread } from "@/lib/gmail"
import { encrypt, decryptThread } from "@/lib/crypto"
import type { Prisma } from "@/generated/prisma/client"

const CATEGORIES = ["NEEDS_ATTENTION", "CAN_WAIT", "IGNORE"]

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

    // Live-fetch from Gmail to pick up any replies that arrived since last sync
    try {
      const live = await fetchThread(session.user.id, thread.gmailThreadId, thread.accountEmail)
      const knownIds = new Set(thread.emails.map((e) => e.gmailMessageId))
      const newMessages = live.messages.filter((m) => !knownIds.has(m.gmailMessageId))

      if (newMessages.length > 0) {
        await Promise.all(
          newMessages.map((msg) =>
            prisma.email.create({
              data: {
                gmailMessageId: msg.gmailMessageId,
                threadId: thread.id,
                from: msg.from,
                fromName: msg.fromName,
                to: msg.to,
                cc: msg.cc,
                bcc: msg.bcc,
                subject: msg.subject,
                bodyHtml: msg.bodyHtml ? encrypt(msg.bodyHtml, session.user.id) : null,
                bodyText: msg.bodyText ? encrypt(msg.bodyText, session.user.id) : null,
                snippet: encrypt(msg.snippet, session.user.id),
                isRead: msg.isRead,
                isSent: msg.isSent,
                internalDate: msg.internalDate,
                headers: msg.headers as any,
                attachments: msg.attachments as any,
              },
            })
          )
        )
        // Update thread metadata to reflect the latest state
        await prisma.thread.update({
          where: { id: thread.id },
          data: {
            messageCount: live.messageCount,
            snippet: encrypt(live.snippet, session.user.id),
            historyId: live.historyId ?? null,
            lastMessageAt: live.lastMessageAt,
            participantEmails: live.participantEmails,
            participantNames: live.participantNames,
          },
        })
        // Re-read with the newly inserted messages
        const updated = await prisma.thread.findFirst({
          where: { id: threadId },
          include: {
            emails: { orderBy: { internalDate: "asc" } },
            labels: { include: { label: true } },
            followUps: { orderBy: { scheduledFor: "asc" } },
          },
        })
        if (updated) {
          const unread = updated.emails.find((e) => !e.isRead)
          if (unread) {
            await Promise.all([
              markAsRead(session.user.id, unread.gmailMessageId, thread.accountEmail),
              prisma.email.update({ where: { id: unread.id }, data: { isRead: true } }),
              prisma.thread.update({ where: { id: threadId }, data: { isRead: true } }),
            ])
          }
          return NextResponse.json(decryptThread({ ...updated, isRead: true }, session.user.id))
        }
      }
    } catch {
      // Gmail fetch failed (e.g. token expired) — fall through and return what we have in DB
    }

    // Mark first unread message as read
    const unreadEmail = thread.emails.find((e) => !e.isRead)
    if (unreadEmail) {
      await Promise.all([
        markAsRead(session.user.id, unreadEmail.gmailMessageId, thread.accountEmail),
        prisma.email.update({ where: { id: unreadEmail.id }, data: { isRead: true } }),
        prisma.thread.update({ where: { id: threadId }, data: { isRead: true } }),
      ])
    }

    return NextResponse.json(decryptThread(thread, session.user.id))
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

    const updates: Prisma.ThreadUpdateInput = {}
    const account = thread.accountEmail

    if (typeof body.isArchived === "boolean") {
      updates.isArchived = body.isArchived
      await archiveThread(session.user.id, thread.gmailThreadId, body.isArchived, account)
    }
    if (typeof body.isStarred === "boolean") {
      updates.isStarred = body.isStarred
      await starThread(session.user.id, thread.gmailThreadId, body.isStarred, account)
    }
    if (typeof body.isRead === "boolean") {
      updates.isRead = body.isRead
      await setThreadRead(session.user.id, thread.gmailThreadId, body.isRead, account)
    }
    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 })
      }
      updates.category = body.category
    }
    if (typeof body.isSnoozed === "boolean") {
      const until = body.snoozedUntil ? new Date(body.snoozedUntil) : null
      if (body.isSnoozed && (!until || isNaN(until.getTime()))) {
        return NextResponse.json({ error: "Invalid snooze time" }, { status: 400 })
      }
      updates.isSnoozed = body.isSnoozed
      updates.snoozedUntil = body.isSnoozed ? until : null
    }

    const updated = await prisma.thread.update({ where: { id: threadId }, data: updates })
    return NextResponse.json(decryptThread(updated, session.user.id))
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

    await deleteThread(session.user.id, thread.gmailThreadId, thread.accountEmail)
    await prisma.thread.delete({ where: { id: threadId } })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
