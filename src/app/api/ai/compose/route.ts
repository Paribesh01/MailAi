import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { to, subject, instruction, tone = "Friendly" } = await req.json()

    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a writing assistant drafting emails on behalf of ${session.user.name} (${session.user.email}).
Write professional, natural emails. Always follow proper email format:
1. Start with an appropriate greeting (e.g. "Hi [Name]," or "Hello," if name unknown)
2. Blank line after greeting
3. Email body
4. Blank line before sign-off
5. Sign-off (e.g. "Best regards," or "Thanks,") then a new line with "${session.user.name}"
Tone: ${tone}. Never use filler like "I hope this email finds you well."`,
        },
        {
          role: "user",
          content: `Write an email${to ? ` to ${to}` : ""}${subject ? ` about "${subject}"` : ""}.
${instruction ? `Instructions: ${instruction}` : "Write a clear, professional email."}

Return only the email body (greeting + content + sign-off). No subject line, no meta-commentary.`,
        },
      ],
      temperature: 0.4,
    })

    const body = res.choices[0]?.message?.content ?? ""
    return NextResponse.json({ body })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
