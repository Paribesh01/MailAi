import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { decryptEmail } from "@/lib/crypto"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get("threadId")
    if (!threadId) return NextResponse.json({ items: [] })

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
    })
    if (!thread) return NextResponse.json({ items: [] })

    const items = await prisma.actionItem.findMany({
      where: { threadId: thread.id, userId: session.user.id },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const { id, isDone } = await req.json()
    const item = await prisma.actionItem.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const updated = await prisma.actionItem.update({ where: { id }, data: { isDone } })
    return NextResponse.json({ item: updated })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { threadId } = await req.json()

    const thread = await prisma.thread.findFirst({
      where: { id: threadId, userId: session.user.id },
      include: { emails: { orderBy: { internalDate: "asc" } } },
    })
    if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const emailBodies = thread.emails
      .map((e) => {
        const dec = decryptEmail(e, session.user.id)
        return dec.bodyText || dec.snippet || ""
      })
      .filter(Boolean)
      .join("\n\n---\n\n")

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Extract explicit action items and to-dos from this email thread. Return JSON array of strings. Each string is one clear action item. If none, return empty array. No markdown.",
        },
        {
          role: "user",
          content: emailBodies,
        },
      ],
      temperature: 0.2,
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]"

    let actionStrings: string[] = []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        actionStrings = parsed.filter((item) => typeof item === "string")
      }
    } catch {
      actionStrings = []
    }

    // Upsert: delete existing action items for this thread, then create new ones
    await prisma.actionItem.deleteMany({
      where: { threadId: thread.id, userId: session.user.id },
    })

    const items = await prisma.$transaction(
      actionStrings.map((text) =>
        prisma.actionItem.create({
          data: {
            text,
            threadId: thread.id,
            userId: session.user.id,
          },
        })
      )
    )

    return NextResponse.json({ items })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
