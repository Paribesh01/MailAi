import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are an intelligent email triage assistant. Categorize emails into exactly one of:
- NEEDS_ATTENTION: urgent, requires a reply, time-sensitive, from a real person/colleague
- CAN_WAIT: informational, low urgency, newsletters from people you know, FYIs
- IGNORE: cold outreach, marketing, spam, automated notifications, mass newsletters

Also flag isNoise=true for cold emails, mass marketing, newsletters, and automated alerts.

Respond with JSON only.`,
    messages: [
      {
        role: "user",
        content: `Categorize this email:
From: ${opts.from}
Subject: ${opts.subject}
Body preview: ${opts.body.slice(0, 600)}

Return JSON: {"category": "NEEDS_ATTENTION"|"CAN_WAIT"|"IGNORE", "reason": "short reason", "aiSummary": "1-sentence summary", "isNoise": true|false}`,
      },
    ],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}"
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
  return {
    category: (json.category as EmailCategory) ?? "CAN_WAIT",
    reason: json.reason ?? "",
    aiSummary: json.aiSummary ?? "",
    isNoise: json.isNoise ?? false,
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

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a writing assistant that drafts email replies on behalf of ${opts.userName} (${opts.userEmail}).
Match their tone, style, and voice exactly. Write concise, natural replies. Never start with "I hope this email finds you well" or similar filler.${voiceContext}`,
    messages: [
      {
        role: "user",
        content: `Draft a reply to this email thread (subject: "${opts.subject}"):

${history}

${opts.instruction ? `Instructions: ${opts.instruction}` : "Draft a helpful, concise reply."}

Return only the reply body (no subject line, no headers).`,
      },
    ],
  })

  return msg.content[0].type === "text" ? msg.content[0].text : ""
}

export async function suggestFollowUp(opts: {
  subject: string
  threadSnippet: string
  lastMessageDate: string
  autoFollowUpDays: number
}): Promise<{ message: string; scheduledFor: Date }> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    system: `You suggest follow-up reminders for unanswered emails.
Return a short follow-up message and how many days from now to send it.
Respond with JSON only.`,
    messages: [
      {
        role: "user",
        content: `Email thread: "${opts.subject}"
Last activity: ${opts.lastMessageDate}
Snippet: ${opts.threadSnippet}

Suggest a follow-up. Return JSON: {"message": "short follow-up text", "daysFromNow": number}
Use ${opts.autoFollowUpDays} days as default if unsure.`,
      },
    ],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}"
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")

  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + (json.daysFromNow ?? opts.autoFollowUpDays))

  return {
    message: json.message ?? "Following up on this thread.",
    scheduledFor,
  }
}

export async function summarizeThread(messages: Array<{ from: string; body: string; date: string }>): Promise<string> {
  const history = messages
    .map((m) => `[${m.date}] ${m.from}: ${m.body.slice(0, 500)}`)
    .join("\n\n")

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Summarize this email thread in 2-3 sentences. Be concrete about what was discussed and what action is needed (if any).\n\n${history}`,
      },
    ],
  })

  return msg.content[0].type === "text" ? msg.content[0].text : ""
}

export async function improvedraft(draft: string, instruction: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Improve this email draft based on the instruction.

Draft:
${draft}

Instruction: ${instruction}

Return only the improved draft body.`,
      },
    ],
  })

  return msg.content[0].type === "text" ? msg.content[0].text : draft
}
