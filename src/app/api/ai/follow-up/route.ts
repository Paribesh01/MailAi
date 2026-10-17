import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { suggestFollowUp } from "@/lib/ai"
import { safeDecrypt } from "@/lib/crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId, manualDate, manualMessage } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    let suggestion: { message: string | null; scheduledFor: Date; aiGenerated: boolean }
    if (manualDate) {
      // User picked a date (yyyy-MM-dd): remind at 9am that day
      const scheduledFor = new Date(`${manualDate}T09:00:00`)
      if (isNaN(scheduledFor.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 })
      }
      suggestion = {
        message: typeof manualMessage === "string" && manualMessage.trim() ? manualMessage.trim() : null,
        scheduledFor,
        aiGenerated: false,
      }
    } else {
      const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } })
      const ai = await suggestFollowUp({
        subject: thread.subject,
        threadSnippet: safeDecrypt(thread.snippet, session.user.id) ?? "",
        lastMessageDate: thread.lastMessageAt.toLocaleDateString(),
        autoFollowUpDays: prefs?.autoFollowUpDays ?? 3,
      })
      suggestion = { ...ai, aiGenerated: true }
    }

    const followUp = await prisma.followUp.create({
      data: {
        threadId: thread.id,
        userId: session.user.id,
        message: suggestion.message,
        scheduledFor: suggestion.scheduledFor,
        aiGenerated: suggestion.aiGenerated,
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
