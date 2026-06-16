import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { draftReply } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId, instruction } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      include: { emails: { orderBy: { internalDate: "asc" } } },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } })

    const history = thread.emails.map((e) => ({
      from: e.fromName ? `${e.fromName} <${e.from}>` : e.from,
      body: e.bodyText || e.snippet,
      date: e.internalDate.toLocaleDateString(),
    }))

    const draft = await draftReply({
      threadHistory: history,
      subject: thread.subject,
      userEmail: session.user.email,
      userName: session.user.name,
      voiceSamples: prefs?.aiVoiceSamples ?? [],
      instruction,
    })

    return NextResponse.json({ draft })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
