import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { searchEmails } from "@/lib/gmail"

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const q = new URL(req.url).searchParams.get("q") ?? ""
    if (!q.trim()) return NextResponse.json({ threads: [] })

    // Search Gmail live
    const gmailResults = await searchEmails(session.user.id, q, 20)
    const gmailIds = gmailResults.map((t: any) => t.id)

    // Return matching threads from DB
    const threads = await prisma.thread.findMany({
      where: {
        userId: session.user.id,
        gmailThreadId: { in: gmailIds },
      },
      include: { labels: { include: { label: true } } },
      orderBy: { lastMessageAt: "desc" },
    })

    return NextResponse.json({ threads })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
