import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { summarizeThread } from "@/lib/ai"
import { decryptEmail, encrypt } from "@/lib/crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      include: { emails: { orderBy: { internalDate: "asc" } } },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const messages = thread.emails.map((e) => {
      const dec = decryptEmail(e, session.user.id)
      return {
        from: dec.fromName ? `${dec.fromName} <${dec.from}>` : dec.from,
        body: dec.bodyText || dec.snippet,
        date: dec.internalDate.toLocaleDateString(),
      }
    })

    const summary = await summarizeThread(messages)

    await prisma.thread.update({
      where: { id: thread.id },
      data: { aiSummary: encrypt(summary, session.user.id) },
    })

    return NextResponse.json({ summary })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
