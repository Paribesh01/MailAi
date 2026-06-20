import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { decryptEmail } from "@/lib/crypto"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      include: {
        emails: {
          orderBy: { internalDate: "desc" },
          take: 3,
        },
      },
    })

    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const lastEmail = thread.emails[0]
    if (!lastEmail) return NextResponse.json({ error: "No emails in thread" }, { status: 400 })

    const dec = decryptEmail(lastEmail, session.user.id)
    const subject = dec.subject || "(no subject)"
    const sender = dec.fromName ? `${dec.fromName} <${dec.from}>` : dec.from
    const snippet = dec.bodyText ? dec.bodyText.slice(0, 500) : dec.snippet || ""

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Generate exactly 3 short one-line email reply options. Return a JSON array of 3 strings only. No markdown, no explanation.",
        },
        {
          role: "user",
          content: `Email: ${subject} from ${sender}: ${snippet}. Generate 3 natural short replies.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]"

    let replies: string[]
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        replies = parsed.slice(0, 3).map(String)
      } else {
        replies = [
          "Sure, sounds good!",
          "Let me check and get back to you.",
          "Can we schedule a call?",
        ]
      }
    } catch {
      replies = [
        "Sure, sounds good!",
        "Let me check and get back to you.",
        "Can we schedule a call?",
      ]
    }

    return NextResponse.json({ replies })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
