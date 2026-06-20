import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { sendEmail } from "@/lib/gmail"
import { randomBytes } from "crypto"
function createId() { return randomBytes(16).toString("hex") }
import { prisma } from "@/lib/prisma"

interface Recipient {
  email: string
  name?: string
  [key: string]: string | undefined
}

function interpolate(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export async function POST(req: NextRequest) {
  const session = await requireSession()
  const { subject, body, recipients, enableTracking } = await req.json() as {
    subject: string
    body: string
    recipients: Recipient[]
    enableTracking: boolean
  }

  if (!recipients?.length) return NextResponse.json({ error: "No recipients" }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const results: { email: string; status: "sent" | "failed"; error?: string }[] = []

  for (const r of recipients) {
    const vars: Record<string, string | undefined> = { ...r, name: r.name ?? r.email.split("@")[0] }
    const personalizedSubject = interpolate(subject, vars)
    let personalizedBody = interpolate(body.replace(/\n/g, "<br>"), vars)

    if (enableTracking) {
      const trackingId = createId()
      await prisma.emailTrack.create({
        data: {
          userId: session.user.id,
          trackingId,
          toEmail: r.email,
          subject: personalizedSubject,
        },
      })
      personalizedBody += `<img src="${appUrl}/api/track/open/${trackingId}" width="1" height="1" alt="" style="display:none"/>`
    }

    try {
      await sendEmail(session.user.id, {
        to: r.email,
        subject: personalizedSubject,
        body: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6">${personalizedBody}</div>`,
      })
      results.push({ email: r.email, status: "sent" })
    } catch (err: any) {
      results.push({ email: r.email, status: "failed", error: err.message })
    }

    // Rate limit: 1 email/sec to avoid Gmail quota
    await new Promise((r) => setTimeout(r, 1000))
  }

  return NextResponse.json({ results })
}
