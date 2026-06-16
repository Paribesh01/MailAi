import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

async function getGmailClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
  })
  if (!account?.accessToken) throw new Error("No Google account linked")

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  )

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.accessTokenExpiresAt?.getTime(),
  })

  // Auto-refresh and persist new tokens
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        accessTokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
      },
    })
  })

  return google.gmail({ version: "v1", auth: oauth2Client })
}

export interface GmailThread {
  gmailThreadId: string
  subject: string
  snippet: string
  lastMessageAt: Date
  participantEmails: string[]
  participantNames: string[]
  messageCount: number
  messages: GmailMessage[]
}

export interface GmailMessage {
  gmailMessageId: string
  from: string
  fromName: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  bodyHtml: string
  bodyText: string
  snippet: string
  internalDate: Date
  isRead: boolean
  headers: Record<string, string>
  attachments: Attachment[]
}

export interface Attachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

function decodeBase64(data: string) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

function extractHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string) {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
}

function parseAddressList(raw: string): { email: string; name: string }[] {
  if (!raw) return []
  return raw.split(",").map((addr) => {
    const match = addr.trim().match(/^"?([^"<]+)"?\s*<?([^>]+)?>?$/)
    if (match) return { name: match[1].trim(), email: match[2]?.trim() ?? match[1].trim() }
    return { name: addr.trim(), email: addr.trim() }
  })
}

function extractBody(payload: any): { html: string; text: string } {
  let html = ""
  let text = ""

  function walk(part: any) {
    const mime = part.mimeType ?? ""
    if (mime === "text/html" && part.body?.data) {
      html = decodeBase64(part.body.data)
    } else if (mime === "text/plain" && part.body?.data) {
      text = decodeBase64(part.body.data)
    } else if (part.parts) {
      part.parts.forEach(walk)
    }
  }

  walk(payload)
  return { html, text }
}

function extractAttachments(payload: any): Attachment[] {
  const attachments: Attachment[] = []

  function walk(part: any) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        size: part.body.size ?? 0,
        attachmentId: part.body.attachmentId,
      })
    }
    if (part.parts) part.parts.forEach(walk)
  }

  walk(payload)
  return attachments
}

function parseMessage(msg: any): GmailMessage {
  const headers = msg.payload?.headers ?? []
  const from = extractHeader(headers, "from")
  const fromParsed = parseAddressList(from)[0] ?? { name: "", email: from }
  const to = parseAddressList(extractHeader(headers, "to")).map((a) => a.email)
  const cc = parseAddressList(extractHeader(headers, "cc")).map((a) => a.email)
  const bcc = parseAddressList(extractHeader(headers, "bcc")).map((a) => a.email)
  const { html, text } = extractBody(msg.payload)
  const headerMap: Record<string, string> = {}
  headers.forEach((h: any) => { if (h.name) headerMap[h.name] = h.value ?? "" })

  return {
    gmailMessageId: msg.id,
    from: fromParsed.email,
    fromName: fromParsed.name,
    to,
    cc,
    bcc,
    subject: extractHeader(headers, "subject"),
    bodyHtml: html,
    bodyText: text,
    snippet: msg.snippet ?? "",
    internalDate: new Date(Number(msg.internalDate)),
    isRead: !msg.labelIds?.includes("UNREAD"),
    headers: headerMap,
    attachments: extractAttachments(msg.payload),
  }
}

export async function fetchThreads(userId: string, maxResults = 50, pageToken?: string) {
  const gmail = await getGmailClient(userId)

  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    pageToken,
    q: "in:inbox",
  })

  const threadList = res.data.threads ?? []

  const threads = await Promise.all(
    threadList.map(async (t) => {
      const detail = await gmail.users.threads.get({
        userId: "me",
        id: t.id!,
        format: "full",
      })

      const messages = (detail.data.messages ?? []).map(parseMessage)
      const first = messages[0]
      const last = messages[messages.length - 1]

      const allParticipants = messages.flatMap((m) => [
        { email: m.from, name: m.fromName },
        ...m.to.map((e) => ({ email: e, name: "" })),
      ])
      const seen = new Set<string>()
      const uniqueParticipants = allParticipants.filter((p) => {
        if (seen.has(p.email)) return false
        seen.add(p.email)
        return true
      })

      return {
        gmailThreadId: t.id!,
        subject: first?.subject ?? "(no subject)",
        snippet: last?.snippet ?? detail.data.snippet ?? "",
        lastMessageAt: last?.internalDate ?? new Date(),
        participantEmails: uniqueParticipants.map((p) => p.email),
        participantNames: uniqueParticipants.map((p) => p.name),
        messageCount: messages.length,
        messages,
      } satisfies GmailThread
    })
  )

  return { threads, nextPageToken: res.data.nextPageToken }
}

export async function fetchThread(userId: string, gmailThreadId: string): Promise<GmailThread> {
  const gmail = await getGmailClient(userId)
  const detail = await gmail.users.threads.get({
    userId: "me",
    id: gmailThreadId,
    format: "full",
  })

  const messages = (detail.data.messages ?? []).map(parseMessage)
  const first = messages[0]
  const last = messages[messages.length - 1]

  const allParticipants = messages.flatMap((m) => [
    { email: m.from, name: m.fromName },
    ...m.to.map((e) => ({ email: e, name: "" })),
  ])
  const seen = new Set<string>()
  const uniqueParticipants = allParticipants.filter((p) => {
    if (seen.has(p.email)) return false
    seen.add(p.email)
    return true
  })

  return {
    gmailThreadId: gmailThreadId,
    subject: first?.subject ?? "(no subject)",
    snippet: last?.snippet ?? "",
    lastMessageAt: last?.internalDate ?? new Date(),
    participantEmails: uniqueParticipants.map((p) => p.email),
    participantNames: uniqueParticipants.map((p) => p.name),
    messageCount: messages.length,
    messages,
  }
}

export async function sendEmail(
  userId: string,
  opts: { to: string; subject: string; body: string; replyToMessageId?: string; threadId?: string }
) {
  const gmail = await getGmailClient(userId)
  const userInfo = await gmail.users.getProfile({ userId: "me" })
  const from = userInfo.data.emailAddress!

  const headers = [
    `From: ${from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ]
  if (opts.replyToMessageId) headers.push(`In-Reply-To: ${opts.replyToMessageId}`)

  const raw = Buffer.from(headers.join("\r\n") + "\r\n\r\n" + opts.body)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: opts.threadId },
  })

  return res.data
}

export async function markAsRead(userId: string, messageId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  })
}

export async function archiveThread(userId: string, threadId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { removeLabelIds: ["INBOX"] },
  })
}

export async function starThread(userId: string, threadId: string, star: boolean) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: star
      ? { addLabelIds: ["STARRED"] }
      : { removeLabelIds: ["STARRED"] },
  })
}

export async function deleteThread(userId: string, threadId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.trash({ userId: "me", id: threadId })
}

export async function searchEmails(userId: string, query: string, maxResults = 20) {
  const gmail = await getGmailClient(userId)
  const res = await gmail.users.threads.list({ userId: "me", q: query, maxResults })
  return res.data.threads ?? []
}
