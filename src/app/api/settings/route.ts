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

// Only these fields may be changed from the client
function pickPreferences(body: Record<string, unknown>) {
  const data: {
    theme?: string
    emailSignature?: string | null
    autoFollowUpDays?: number
    notifyOnNewEmail?: boolean
    dailyDigest?: boolean
    aiVoiceSamples?: string[]
    writingTone?: string | null
  } = {}
  if (typeof body.theme === "string") data.theme = body.theme
  if (typeof body.emailSignature === "string" || body.emailSignature === null) data.emailSignature = body.emailSignature
  if (typeof body.autoFollowUpDays === "number" && Number.isFinite(body.autoFollowUpDays)) {
    data.autoFollowUpDays = Math.min(30, Math.max(1, Math.round(body.autoFollowUpDays)))
  }
  if (typeof body.notifyOnNewEmail === "boolean") data.notifyOnNewEmail = body.notifyOnNewEmail
  if (typeof body.dailyDigest === "boolean") data.dailyDigest = body.dailyDigest
  if (Array.isArray(body.aiVoiceSamples)) {
    data.aiVoiceSamples = body.aiVoiceSamples.filter((v): v is string => typeof v === "string").slice(0, 10)
  }
  if (typeof body.writingTone === "string" || body.writingTone === null) data.writingTone = body.writingTone
  return data
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const data = pickPreferences(await req.json())

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    })
    return NextResponse.json(prefs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
