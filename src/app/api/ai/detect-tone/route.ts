import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const TONES = ["Friendly", "Formal", "Brief", "Assertive", "Warm", "Casual", "Professional"] as const
type Tone = (typeof TONES)[number]

async function getGmailClient(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, providerId: "google" } })
  if (!account?.accessToken) throw new Error("No Google account linked")
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  )
  oauth2.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.accessTokenExpiresAt?.getTime(),
  })
  oauth2.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })
  return google.gmail({ version: "v1", auth: oauth2 })
}

export async function POST() {
  const session = await requireSession()

  const gmail = await getGmailClient(session.user.id)

  // Fetch up to 20 recent sent emails
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["SENT"],
    maxResults: 20,
  })

  const messages = listRes.data.messages ?? []
  if (messages.length === 0) {
    return NextResponse.json({ tone: "Friendly", source: "default" })
  }

  // Fetch bodies (plain text preferred)
  const bodies: string[] = []
  await Promise.all(
    messages.slice(0, 15).map(async (msg) => {
      try {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
          format: "full",
        })
        const parts = detail.data.payload?.parts ?? [detail.data.payload]
        for (const part of parts) {
          if (part?.mimeType === "text/plain" && part.body?.data) {
            const text = Buffer.from(part.body.data, "base64url").toString("utf-8").trim()
            if (text.length > 30) { bodies.push(text.slice(0, 400)); break }
          }
        }
      } catch { /* skip failed messages */ }
    })
  )

  if (bodies.length === 0) {
    return NextResponse.json({ tone: "Friendly", source: "default" })
  }

  const sample = bodies.slice(0, 10).join("\n\n---\n\n")

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Analyze the writing style of these emails written by the same person and classify their overall tone into exactly one of these categories: ${TONES.join(", ")}.

Emails:
${sample}

Reply with ONLY the tone word — nothing else.`,
      },
    ],
    temperature: 0,
    max_tokens: 10,
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? ""
  const detected = TONES.find((t) => raw.toLowerCase().includes(t.toLowerCase())) ?? "Friendly"

  // Persist to preferences
  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: { writingTone: detected },
    create: { userId: session.user.id, writingTone: detected },
  })

  return NextResponse.json({ tone: detected, source: "detected", samplesAnalyzed: bodies.length })
}
