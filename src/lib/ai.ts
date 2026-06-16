import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const FAST_MODEL = "llama-3.1-8b-instant"
const SMART_MODEL = "llama-3.3-70b-versatile"

async function chat(model: string, system: string, user: string): Promise<string> {
  const res = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.3,
  })
  return res.choices[0]?.message?.content ?? ""
}

export type EmailCategory = "NEEDS_ATTENTION" | "CAN_WAIT" | "IGNORE"

export interface CategorizeResult {
  category: EmailCategory
  reason: string
  aiSummary: string
  isNoise: boolean
}

export async function categorizeEmail(opts: {
  subject: string
  from: string
  snippet: string
  body: string
}): Promise<CategorizeResult> {
  const text = await chat(
    FAST_MODEL,
    `You are an intelligent email triage assistant. Categorize emails into exactly one of:
- NEEDS_ATTENTION: urgent, requires a reply, time-sensitive, from a real person or colleague
- CAN_WAIT: informational, low urgency, newsletters from people you know, FYIs
- IGNORE: cold outreach, marketing, spam, automated notifications, mass newsletters

Also flag isNoise=true for cold emails, mass marketing, newsletters, and automated alerts.
Respond with JSON only. No markdown, no explanation.`,
    `Categorize this email:
From: ${opts.from}
Subject: ${opts.subject}
Body preview: ${opts.body.slice(0, 600)}

Return JSON: {"category":"NEEDS_ATTENTION"|"CAN_WAIT"|"IGNORE","reason":"short reason","aiSummary":"1-sentence summary","isNoise":true|false}`
  )

  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
    return {
      category: (json.category as EmailCategory) ?? "CAN_WAIT",
      reason: json.reason ?? "",
      aiSummary: json.aiSummary ?? "",
      isNoise: json.isNoise ?? false,
    }
  } catch {
    return { category: "CAN_WAIT", reason: "", aiSummary: "", isNoise: false }
  }
}

export async function draftReply(opts: {
  threadHistory: Array<{ from: string; body: string; date: string }>
  subject: string
  userEmail: string
  userName: string
  voiceSamples?: string[]
  instruction?: string
}): Promise<string> {
  const history = opts.threadHistory
    .map((m) => `[${m.date}] ${m.from}:\n${m.body.slice(0, 800)}`)
    .join("\n\n---\n\n")

  const voiceContext = opts.voiceSamples?.length
    ? `\n\nHere are examples of how ${opts.userName} typically writes:\n${opts.voiceSamples.slice(0, 3).join("\n---\n")}`
    : ""

  return chat(
    SMART_MODEL,
    `You are a writing assistant that drafts email replies on behalf of ${opts.userName} (${opts.userEmail}).
Match their tone, style, and voice exactly. Write concise, natural replies. Never start with "I hope this email finds you well" or similar filler.${voiceContext}`,
    `Draft a reply to this email thread (subject: "${opts.subject}"):

${history}

${opts.instruction ? `Instructions: ${opts.instruction}` : "Draft a helpful, concise reply."}

Return only the reply body. No subject line, no headers, no explanation.`
  )
}

export async function suggestFollowUp(opts: {
  subject: string
  threadSnippet: string
  lastMessageDate: string
  autoFollowUpDays: number
}): Promise<{ message: string; scheduledFor: Date }> {
  const text = await chat(
    FAST_MODEL,
    `You suggest follow-up reminders for unanswered emails. Return JSON only. No markdown.`,
    `Email thread: "${opts.subject}"
Last activity: ${opts.lastMessageDate}
Snippet: ${opts.threadSnippet}

Suggest a follow-up. Return JSON: {"message":"short follow-up text","daysFromNow":${opts.autoFollowUpDays}}`
  )

  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
    const scheduledFor = new Date()
    scheduledFor.setDate(scheduledFor.getDate() + (json.daysFromNow ?? opts.autoFollowUpDays))
    return { message: json.message ?? "Following up on this thread.", scheduledFor }
  } catch {
    const scheduledFor = new Date()
    scheduledFor.setDate(scheduledFor.getDate() + opts.autoFollowUpDays)
    return { message: "Following up on this thread.", scheduledFor }
  }
}

export async function summarizeThread(
  messages: Array<{ from: string; body: string; date: string }>
): Promise<string> {
  const history = messages
    .map((m) => `[${m.date}] ${m.from}: ${m.body.slice(0, 500)}`)
    .join("\n\n")

  return chat(
    FAST_MODEL,
    "Summarize email threads in 2-3 sentences. Be concrete about what was discussed and what action is needed (if any). Return only the summary, no preamble.",
    `Summarize this email thread:\n\n${history}`
  )
}

export async function improvedraft(draft: string, instruction: string): Promise<string> {
  return chat(
    SMART_MODEL,
    "You improve email drafts based on instructions. Return only the improved draft body. No explanation, no preamble.",
    `Improve this email draft based on the instruction.

Draft:
${draft}

Instruction: ${instruction}`
  )
}
