import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireSession()
  const filters = await prisma.customFilter.findMany({
    where: { userId: session.user.id },
    orderBy: { position: "asc" },
  })
  return NextResponse.json({ filters })
}

export async function POST(req: NextRequest) {
  const session = await requireSession()
  const body = await req.json()
  const { name, color, conditions } = body

  const last = await prisma.customFilter.findFirst({
    where: { userId: session.user.id },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  const filter = await prisma.customFilter.create({
    data: {
      userId: session.user.id,
      name: String(name).trim(),
      color: color ?? "#6b7db3",
      conditions: conditions ?? {},
      position: (last?.position ?? -1) + 1,
    },
  })
  return NextResponse.json(filter)
}

export async function DELETE(req: NextRequest) {
  const session = await requireSession()
  const { id } = await req.json()
  await prisma.customFilter.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ ok: true })
}
