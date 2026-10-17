import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"

/**
 * Send scheduled emails that are due. Pass a userId to limit to one user,
 * or omit it (cron) to process everyone.
 *
 * Each email is claimed by flipping pending -> sending first, so concurrent
 * callers (two tabs, cron + poll) can never send the same email twice.
 */
export async function processDueScheduledEmails(userId?: string) {
  const due = await prisma.scheduledEmail.findMany({
    where: {
      ...(userId ? { userId } : {}),
      status: "pending",
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  })

  let sent = 0
  for (const email of due) {
    const claimed = await prisma.scheduledEmail.updateMany({
      where: { id: email.id, status: "pending" },
      data: { status: "sending" },
    })
    if (claimed.count === 0) continue

    try {
      await sendEmail(email.userId, { to: email.to, subject: email.subject, body: email.body })
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: "sent", sentAt: new Date(), error: null },
      })
      sent++
    } catch (err: unknown) {
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: "failed", error: err instanceof Error ? err.message : "Send failed" },
      })
    }
  }

  return { processed: due.length, sent }
}
