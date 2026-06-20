import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireSession()
  const accounts = await prisma.linkedAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true, email: true, name: true, image: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ accounts })
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession()
  const { id } = await req.json()
  await prisma.linkedAccount.deleteMany({
    where: { id, userId: session.user.id },
  })
  return NextResponse.json({ ok: true })
}
