import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { fetchThreads } from "@/lib/gmail"
import { categorizeEmail } from "@/lib/ai"
import { encrypt } from "@/lib/crypto"

export async function POST() {
  try {
    const session = await requireSession()
    const userId = session.user.id

    const syncRecord = await prisma.emailSync.findUnique({ where: { userId } })
    const { threads } = await fetchThreads(userId, 50)

    // Load VIP emails once for the whole sync
    const vipContacts = await prisma.vipContact.findMany({
      where: { userId },
      select: { email: true },
    })
    const vipSet = new Set(vipContacts.map((v) => v.email.toLowerCase()))

    let synced = 0
    let newThreads = 0

    for (const t of threads) {
      const existing = await prisma.thread.findUnique({
        where: { gmailThreadId: t.gmailThreadId },
      })

      // Categorize only new threads
      let category = existing?.category ?? ("NEEDS_ATTENTION" as const)
      let aiSummary = existing?.aiSummary ?? null

      if (!existing) {
        newThreads++
        const firstMsg = t.messages[0]
        if (firstMsg) {
          // VIP senders always go to NEEDS_ATTENTION, skip AI categorization
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
      } else if (existing) {
        // If sender became VIP after initial sync, promote existing thread
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
          userId,
        },
        update: {
          snippet: encSnippet,
          lastMessageAt: t.lastMessageAt,
          participantEmails: t.participantEmails,
          participantNames: t.participantNames,
          messageCount: t.messageCount,
        },
      })

      // Upsert each message — encrypt body and snippet at rest
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

    await prisma.emailSync.upsert({
      where: { userId },
      create: { userId, totalSynced: synced },
      update: { lastSyncAt: new Date(), totalSynced: (syncRecord?.totalSynced ?? 0) + synced },
    })

    return NextResponse.json({ synced, newThreads })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
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
