import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireSession()
    const followUps = await prisma.followUp.findMany({
      where: { userId: session.user.id, isDone: false },
      include: { thread: true },
      orderBy: { scheduledFor: "asc" },
    })
    return NextResponse.json({ followUps })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const { id, isDone } = await req.json()

    const fu = await prisma.followUp.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!fu) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.followUp.update({ where: { id }, data: { isDone } })

    // Update thread flag if all follow-ups done
    if (isDone) {
      const remaining = await prisma.followUp.count({
        where: { threadId: fu.threadId, isDone: false },
      })
      if (remaining === 0) {
        await prisma.thread.update({ where: { id: fu.threadId }, data: { hasFollowUp: false } })
      }
    }

    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
