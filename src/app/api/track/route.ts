import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await requireSession()
  const tracks = await prisma.emailTrack.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json({ tracks })
}
