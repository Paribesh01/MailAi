import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireSession()
    const contacts = await prisma.vipContact.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ contacts })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

    const contact = await prisma.vipContact.upsert({
      where: { userId_email: { userId: session.user.id, email } },
      create: { userId: session.user.id, email, name },
      update: { name },
    })
    return NextResponse.json({ contact })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession()
    const { email } = await req.json()
    await prisma.vipContact.deleteMany({
      where: { userId: session.user.id, email },
    })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
