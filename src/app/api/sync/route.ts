import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { fetchThreads, fetchThreadsForLinkedAccount } from "@/lib/gmail"
import { categorizeEmail } from "@/lib/ai"
import { encrypt } from "@/lib/crypto"
import type { GmailThread } from "@/lib/gmail"

async function syncThreadBatch(
  threads: GmailThread[],
  userId: string,
  accountEmail: string | null,
  vipSet: Set<string>
) {
  let synced = 0
  let newThreads = 0

  for (const t of threads) {
    const existing = await prisma.thread.findUnique({
      where: { gmailThreadId: t.gmailThreadId },
    })

    let category = existing?.category ?? ("NEEDS_ATTENTION" as const)
    let aiSummary = existing?.aiSummary ?? null

    if (!existing) {
      newThreads++
      const firstMsg = t.messages[0]
      if (firstMsg) {
        if (vipSet.has(firstMsg.from.toLowerCase())) {
          category = "NEEDS_ATTENTION"
        } else {
          const result = await categorizeEmail({
            subject: t.subject,
            from: firstMsg.from,
            snippet: t.snippet,
            body: firstMsg.bodyText || firstMsg.snippet,
          })
          category = result.category
          aiSummary = result.aiSummary
        }
      }
    } else {
      const firstMsg = t.messages[0]
      if (firstMsg && vipSet.has(firstMsg.from.toLowerCase()) && existing.category !== "NEEDS_ATTENTION") {
        category = "NEEDS_ATTENTION"
      }
    }

    const encSnippet = encrypt(t.snippet, userId)
    const encAiSummary = aiSummary ? encrypt(aiSummary, userId) : null

    const thread = await prisma.thread.upsert({
      where: { gmailThreadId: t.gmailThreadId },
      create: {
        gmailThreadId: t.gmailThreadId,
        subject: t.subject,
        snippet: encSnippet,
        category,
        aiSummary: encAiSummary,
        lastMessageAt: t.lastMessageAt,
        participantEmails: t.participantEmails,
        participantNames: t.participantNames,
        messageCount: t.messageCount,
        accountEmail,
        userId,
      },
      update: {
        snippet: encSnippet,
        lastMessageAt: t.lastMessageAt,
        participantEmails: t.participantEmails,
        participantNames: t.participantNames,
        messageCount: t.messageCount,
        ...(accountEmail !== null ? { accountEmail } : {}),
      },
    })

    for (const msg of t.messages) {
      await prisma.email.upsert({
        where: { gmailMessageId: msg.gmailMessageId },
        create: {
          gmailMessageId: msg.gmailMessageId,
          threadId: thread.id,
          from: msg.from,
          fromName: msg.fromName,
          to: msg.to,
          cc: msg.cc,
          bcc: msg.bcc,
          subject: msg.subject,
          bodyHtml: msg.bodyHtml ? encrypt(msg.bodyHtml, userId) : null,
          bodyText: msg.bodyText ? encrypt(msg.bodyText, userId) : null,
          snippet: encrypt(msg.snippet, userId),
          isRead: msg.isRead,
          internalDate: msg.internalDate,
          headers: msg.headers as any,
          attachments: msg.attachments as any,
        },
        update: { isRead: msg.isRead },
      })
    }

    synced++
  }

  return { synced, newThreads }
}

// Per-user in-memory lock to prevent concurrent syncs
const syncLocks = new Set<string>()

export async function POST() {
  let userId: string | null = null
  try {
    const session = await requireSession()
    userId = session.user.id

    // Prevent concurrent syncs for the same user
    if (syncLocks.has(userId)) {
      return NextResponse.json({ synced: 0, newThreads: 0, skipped: true })
    }
    syncLocks.add(userId)

    const syncRecord = await prisma.emailSync.findUnique({ where: { userId } })

    const vipContacts = await prisma.vipContact.findMany({
      where: { userId },
      select: { email: true },
    })
    const vipSet = new Set(vipContacts.map((v) => v.email.toLowerCase()))

    let totalSynced = 0
    let totalNew = 0

    // Sync primary account (accountEmail = null means primary)
    const { threads: primaryThreads } = await fetchThreads(userId, 50)
    const primary = await syncThreadBatch(primaryThreads, userId, null, vipSet)
    totalSynced += primary.synced
    totalNew += primary.newThreads

    // Sync all linked accounts
    const linkedAccounts = await prisma.linkedAccount.findMany({
      where: { userId },
      select: { id: true, email: true },
    })

    for (const linked of linkedAccounts) {
      try {
        const { threads: linkedThreads } = await fetchThreadsForLinkedAccount(linked.id, 50)
        const result = await syncThreadBatch(linkedThreads, userId, linked.email, vipSet)
        totalSynced += result.synced
        totalNew += result.newThreads
      } catch (err: any) {
        console.error(`Failed to sync linked account ${linked.email}:`, err.message)
      }
    }

    await prisma.emailSync.upsert({
      where: { userId },
      create: { userId, totalSynced },
      update: { lastSyncAt: new Date(), totalSynced: (syncRecord?.totalSynced ?? 0) + totalSynced },
    })

    return NextResponse.json({ synced: totalSynced, newThreads: totalNew })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    if (userId) syncLocks.delete(userId)
  }
}

export async function GET() {
  try {
    const session = await requireSession()
    const sync = await prisma.emailSync.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json(sync)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}
