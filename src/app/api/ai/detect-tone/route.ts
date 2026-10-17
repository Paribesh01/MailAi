import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { getGmailClient, mapWithConcurrency } from "@/lib/gmail"
import Groq from "groq-sdk"
import { SMART_MODEL } from "@/lib/ai"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const TONES = ["Friendly", "Formal", "Brief", "Assertive", "Warm", "Casual", "Professional"] as const
type Tone = (typeof TONES)[number]

type Part = { mimeType?: string | null; body?: { data?: string | null } | null; parts?: Part[] | null }

// Walk nested multipart bodies to find the first text/plain part
function findPlainText(part: Part | null | undefined): string {
  if (!part) return ""
  if (part.mimeType === "text/plain" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8").trim()
  }
  for (const child of part.parts ?? []) {
    const text = findPlainText(child)
    if (text) return text
  }
  return ""
}

async function saveTone(userId: string, tone: Tone) {
  await prisma.userPreferences.upsert({
    where: { userId },
    update: { writingTone: tone },
    create: { userId, writingTone: tone },
  })
}

export async function POST() {
  try {
    const session = await requireSession()
    const gmail = await getGmailClient(session.user.id)

    // Fetch up to 15 recent sent emails
    const listRes = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SENT"],
      maxResults: 15,
    })
    const messages = listRes.data.messages ?? []

    const bodies = (
      await mapWithConcurrency(messages, 5, async (msg) => {
        try {
          const detail = await gmail.users.messages.get({ userId: "me", id: msg.id!, format: "full" })
          const text = findPlainText(detail.data.payload as Part)
          return text.length > 30 ? text.slice(0, 400) : ""
        } catch {
          return ""
        }
      })
    ).filter(Boolean)

    // Save the default too, so we don't re-scan Gmail on every inbox visit
    if (bodies.length === 0) {
      await saveTone(session.user.id, "Friendly")
      return NextResponse.json({ tone: "Friendly", source: "default" })
    }

    const sample = bodies.slice(0, 10).join("\n\n---\n\n")

    const completion = await groq.chat.completions.create({
      model: SMART_MODEL,
      reasoning_effort: "low",
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
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ""
    const detected = TONES.find((t) => raw.toLowerCase().includes(t.toLowerCase())) ?? "Friendly"
    await saveTone(session.user.id, detected)

    return NextResponse.json({ tone: detected, source: "detected", samplesAnalyzed: bodies.length })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 })
  }
}
