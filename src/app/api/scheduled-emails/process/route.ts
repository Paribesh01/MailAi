import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { processDueScheduledEmails } from "@/lib/scheduled"

// Signed-in user: process their own due emails
export async function POST() {
  try {
    const session = await requireSession()
    return NextResponse.json(await processDueScheduledEmails(session.user.id))
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}

// Cron: process every user's due emails. Requires `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    return NextResponse.json(await processDueScheduledEmails())
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
