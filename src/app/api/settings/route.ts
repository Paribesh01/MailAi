import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireSession()
    const prefs = await prisma.userPreferences.findUnique({ where: { userId: session.user.id } })
    return NextResponse.json(prefs ?? { theme: "system", autoFollowUpDays: 3, notifyOnNewEmail: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...body },
      update: body,
    })
    return NextResponse.json(prefs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
