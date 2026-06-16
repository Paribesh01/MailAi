import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { suggestFollowUp } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } })

    const suggestion = await suggestFollowUp({
      subject: thread.subject,
      threadSnippet: thread.snippet,
      lastMessageDate: thread.lastMessageAt.toLocaleDateString(),
      autoFollowUpDays: prefs?.autoFollowUpDays ?? 3,
    })

    const followUp = await prisma.followUp.create({
      data: {
        threadId: thread.id,
        userId: session.user.id,
        message: suggestion.message,
        scheduledFor: suggestion.scheduledFor,
        aiGenerated: true,
      },
    })

    await prisma.thread.update({
      where: { id: thread.id },
      data: { hasFollowUp: true },
    })

    return NextResponse.json(followUp)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
