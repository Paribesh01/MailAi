import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { fetchSpamThreads, markNotSpam, permanentlyDeleteThread } from "@/lib/gmail"

export async function GET() {
  try {
    const session = await requireSession()
    const { threads } = await fetchSpamThreads(session.user.id, 50)
    return NextResponse.json({ threads })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId, action } = await req.json()

    if (action === "not-spam") {
      await markNotSpam(session.user.id, threadId)
    } else if (action === "delete") {
      await permanentlyDeleteThread(session.user.id, threadId)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
