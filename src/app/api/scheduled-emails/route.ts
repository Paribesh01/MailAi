import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

function errorResponse(err: unknown) {
  const msg = err instanceof Error ? err.message : "Unknown error"
  return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
}

export async function GET() {
  try {
    const session = await requireSession()
    const emails = await prisma.scheduledEmail.findMany({
      where: { userId: session.user.id },
      orderBy: { scheduledAt: "asc" },
    })
    return NextResponse.json({ emails })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { to, subject, body, scheduledAt } = await req.json()
    const when = new Date(scheduledAt)
    if (!to || typeof body !== "string") {
      return NextResponse.json({ error: "Recipient and message body are required" }, { status: 400 })
    }
    if (isNaN(when.getTime()) || when.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "Pick a time in the future" }, { status: 400 })
    }
    const email = await prisma.scheduledEmail.create({
      data: { userId: session.user.id, to, subject: subject ?? "", body, scheduledAt: when },
    })
    return NextResponse.json(email)
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession()
    const { id } = await req.json()
    // Only pending emails can be cancelled; one that's already sending can't be recalled
    const res = await prisma.scheduledEmail.deleteMany({
      where: { id, userId: session.user.id, status: { in: ["pending", "failed"] } },
    })
    if (res.count === 0) {
      return NextResponse.json({ error: "This email is already being sent" }, { status: 409 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
