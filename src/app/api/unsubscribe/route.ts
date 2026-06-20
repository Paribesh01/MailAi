import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"

function parseUnsubscribeHeader(header: string): { mailto: string | null; url: string | null } {
  const mailtoMatch = header.match(/<(mailto:[^>]+)>/i)
  const urlMatch = header.match(/<(https?:\/\/[^>]+)>/i)
  return {
    mailto: mailtoMatch?.[1] ?? null,
    url: urlMatch?.[1] ?? null,
  }
}

// GET — list newsletter senders from IGNORE threads that have unsubscribe headers
export async function GET() {
  try {
    const session = await requireSession()
    const userId = session.user.id

    const emails = await prisma.email.findMany({
      where: {
        thread: { userId, category: "IGNORE", isArchived: false },
        isSent: false,
      },
      select: {
        from: true,
        fromName: true,
        headers: true,
        thread: { select: { id: true } },
      },
    })

    // Group by sender email, collect unsubscribe info
    const senderMap = new Map<string, {
      email: string
      name: string
      count: number
      unsubscribeMailto: string | null
      unsubscribeUrl: string | null
    }>()

    for (const e of emails) {
      const headers = (e.headers ?? {}) as Record<string, string>
      const unsubHeader = headers["List-Unsubscribe"] ?? headers["list-unsubscribe"] ?? ""
      const { mailto, url } = parseUnsubscribeHeader(unsubHeader)

      const existing = senderMap.get(e.from)
      if (existing) {
        existing.count++
        if (!existing.unsubscribeMailto && mailto) existing.unsubscribeMailto = mailto
        if (!existing.unsubscribeUrl && url) existing.unsubscribeUrl = url
      } else {
        senderMap.set(e.from, {
          email: e.from,
          name: e.fromName ?? e.from,
          count: 1,
          unsubscribeMailto: mailto,
          unsubscribeUrl: url,
        })
      }
    }

    const senders = Array.from(senderMap.values())
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({ senders })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — execute unsubscribe for a sender
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { senderEmail, unsubscribeMailto } = await req.json()

    if (!senderEmail) return NextResponse.json({ error: "senderEmail required" }, { status: 400 })

    if (unsubscribeMailto) {
      // Send unsubscribe email via Gmail API
      const address = unsubscribeMailto.replace("mailto:", "").split("?")[0]
      const subject = unsubscribeMailto.includes("subject=")
        ? decodeURIComponent(unsubscribeMailto.split("subject=")[1].split("&")[0])
        : "Unsubscribe"

      await sendEmail(session.user.id, {
        to: address,
        subject,
        body: "Please unsubscribe me from your mailing list.",
      })
    }

    // Auto-archive all threads from this sender in IGNORE category
    await prisma.thread.updateMany({
      where: {
        userId: session.user.id,
        category: "IGNORE",
        participantEmails: { has: senderEmail },
      },
      data: { isArchived: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
