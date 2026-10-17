import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { fetchSpamThreads, markNotSpam, permanentlyDeleteThread } from "@/lib/gmail"

export async function GET() {
  try {
    const session = await requireSession()
    const { threads: full } = await fetchSpamThreads(session.user.id, 50)
    // Only what the folder list shows — no bodies
    const threads = full.map((t) => ({
      id: t.gmailThreadId,
      subject: t.subject,
      snippet: t.snippet,
      from: t.messages[t.messages.length - 1]?.fromName || t.participantEmails[0] || "",
      lastMessageAt: t.lastMessageAt,
      messageCount: t.messageCount,
    }))
    return NextResponse.json({ threads })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId, action } = await req.json()
    if (typeof threadId !== "string" || !threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 })
    }

    if (action === "not-spam") {
      await markNotSpam(session.user.id, threadId)
    } else if (action === "delete") {
      await permanentlyDeleteThread(session.user.id, threadId)
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
