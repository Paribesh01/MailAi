import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireSession()
    const labels = await prisma.label.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ labels })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { name, color } = await req.json()

    const label = await prisma.label.create({
      data: { name, color: color ?? "#6366f1", userId: session.user.id },
    })
    return NextResponse.json(label)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
