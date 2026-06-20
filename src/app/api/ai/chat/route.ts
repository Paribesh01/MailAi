import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Groq from "groq-sdk"
import { safeDecrypt } from "@/lib/crypto"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { message, history = [] } = await req.json()

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todayThreads, repliedThreads, unreadCount, needsAttentionCount, starredCount] =
      await Promise.all([
        prisma.thread.findMany({
          where: { userId, lastMessageAt: { gte: today }, isArchived: false },
          orderBy: { lastMessageAt: "desc" },
          take: 20,
          select: {
            subject: true,
            participantNames: true,
            participantEmails: true,
            category: true,
            isRead: true,
            aiSummary: true,
          },
        }),

        prisma.thread.findMany({
          where: {
            userId,
            messageCount: { gt: 1 },
            emails: { some: { isSent: true } },
            isArchived: false,
          },
          orderBy: { lastMessageAt: "desc" },
          take: 10,
          select: {
            subject: true,
            lastMessageAt: true,
            emails: {
              where: { isSent: false },
              orderBy: { internalDate: "desc" },
              take: 1,
              select: { fromName: true, from: true, internalDate: true, snippet: true },
            },
          },
        }),

        prisma.thread.count({ where: { userId, isRead: false, isArchived: false } }),
        prisma.thread.count({ where: { userId, category: "NEEDS_ATTENTION", isArchived: false } }),
        prisma.thread.count({ where: { userId, isStarred: true } }),
      ])

    const todayList = todayThreads.length
      ? todayThreads
          .map((t) => {
            const sender = t.participantNames[0] ?? t.participantEmails[0] ?? "Unknown"
            const cat = t.category.replace("_", " ")
            const unread = t.isRead ? "" : " [UNREAD]"
            const summary = t.aiSummary ? ` — ${safeDecrypt(t.aiSummary, userId)}` : ""
            return `• "${t.subject}" from ${sender} (${cat})${unread}${summary}`
          })
          .join("\n")
      : "No new emails today."

    const repliesList = repliedThreads.length
      ? repliedThreads
          .map((t) => {
            const reply = t.emails[0]
            const from = reply?.fromName ?? reply?.from ?? "someone"
            const date = reply?.internalDate
              ? new Date(reply.internalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "recently"
            const snippet = reply?.snippet ? ` — "${reply.snippet.slice(0, 80)}..."` : ""
            return `• "${t.subject}" — reply from ${from} on ${date}${snippet}`
          })
          .join("\n")
      : "No replies to your sent emails recently."

    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })

    const systemPrompt = `You are an AI inbox assistant for MailAI. Help the user understand and manage their emails. Be concise and direct. Use bullet points when listing items.

TODAY IS: ${dateStr}

TODAY'S EMAIL ACTIVITY (${todayThreads.length} threads):
${todayList}

INBOX STATS:
• Unread: ${unreadCount}
• Needs Attention: ${needsAttentionCount}
• Starred: ${starredCount}

REPLIES TO YOUR SENT EMAILS:
${repliesList}

Answer based on this data. For anything outside this data, say so clearly. Keep answers under 150 words unless the user asks for detail.`

    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user", content: message },
      ],
      temperature: 0.5,
      max_tokens: 400,
    })

    const reply = res.choices[0]?.message?.content ?? "I couldn't process that. Try again."
    return NextResponse.json({ reply })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
