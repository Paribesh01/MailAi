import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"

export async function POST() {
  const session = await requireSession()
  const due = await prisma.scheduledEmail.findMany({
    where: {
      userId: session.user.id,
      status: "pending",
      scheduledAt: { lte: new Date() },
    },
  })

  let sent = 0
  for (const email of due) {
    try {
      await sendEmail(session.user.id, {
        to: email.to,
        subject: email.subject,
        body: email.body,
      })
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: "sent", sentAt: new Date() },
      })
      sent++
    } catch (err: any) {
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: "failed", error: err.message },
      })
    }
  }

  return NextResponse.json({ processed: due.length, sent })
}
