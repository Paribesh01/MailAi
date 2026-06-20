import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/gmail"

export async function GET() {
  const session = await requireSession()
  const emails = await prisma.scheduledEmail.findMany({
    where: { userId: session.user.id },
    orderBy: { scheduledAt: "asc" },
  })
  return NextResponse.json({ emails })
}

export async function POST(req: NextRequest) {
  const session = await requireSession()
  const { to, subject, body, scheduledAt } = await req.json()
  const email = await prisma.scheduledEmail.create({
    data: { userId: session.user.id, to, subject, body, scheduledAt: new Date(scheduledAt) },
  })
  return NextResponse.json(email)
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession()
  const { id } = await req.json()
  await prisma.scheduledEmail.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
