import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  await requireSession()
  const { threads, aiPrompt } = await req.json() as {
    threads: { id: string; subject: string; snippet: string; participantNames: string[]; participantEmails: string[] }[]
    aiPrompt: string
  }

  if (!threads?.length || !aiPrompt) return NextResponse.json({ matchingIds: [] })

  // Batch into groups of 30 to stay within token limits
  const BATCH = 30
  const matchingIds: string[] = []

  for (let i = 0; i < threads.length; i += BATCH) {
    const batch = threads.slice(i, i + BATCH)
    const listText = batch.map((t, idx) =>
      `[${idx}] From: ${t.participantNames[0] ?? t.participantEmails[0] ?? "unknown"} | Subject: ${t.subject} | Preview: ${t.snippet?.slice(0, 120)}`
    ).join("\n")

    const prompt = `You are classifying emails. The user wants to see emails that match this description: "${aiPrompt}"

Here are the emails (indexed 0 to ${batch.length - 1}):
${listText}

Reply ONLY with a JSON array of the indices that match the description. Example: [0, 2, 5]
If none match, reply with: []`

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 200,
      })
      const text = completion.choices[0]?.message?.content?.trim() ?? "[]"
      const match = text.match(/\[[\d\s,]*\]/)
      if (match) {
        const indices: number[] = JSON.parse(match[0])
        for (const idx of indices) {
          if (idx >= 0 && idx < batch.length) matchingIds.push(batch[idx].id)
        }
      }
    } catch {
      // If AI fails for a batch, skip it silently
    }
  }

  return NextResponse.json({ matchingIds })
}
