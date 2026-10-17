import { google } from "googleapis"
import { prisma } from "@/lib/prisma"

export async function getGmailClient(userId: string) {
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

export async function getLinkedGmailClient(linkedAccountId: string) {
  const account = await prisma.linkedAccount.findUnique({
    where: { id: linkedAccountId },
  })
  if (!account?.accessToken) throw new Error("Linked account not found")

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/linked-accounts/callback`
  )

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.expiresAt?.getTime(),
  })

  oauth2Client.on("tokens", async (tokens) => {
    await prisma.linkedAccount.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })

  return google.gmail({ version: "v1", auth: oauth2Client })
}

/** Client for the mailbox a thread belongs to (accountEmail null = primary account). */
export async function getGmailClientForAccount(userId: string, accountEmail?: string | null) {
  if (accountEmail) {
    const linked = await prisma.linkedAccount.findFirst({
      where: { userId, email: accountEmail },
      select: { id: true },
    })
    if (linked) return getLinkedGmailClient(linked.id)
  }
  return getGmailClient(userId)
}

export interface GmailThread {
  gmailThreadId: string
  subject: string
  snippet: string
  lastMessageAt: Date
  participantEmails: string[]
  participantNames: string[]
  messageCount: number
  historyId?: string | null
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
  isSent: boolean
  headers: Record<string, string>
  attachments: Attachment[]
}

export interface Attachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

// Gmail returns snippets HTML-escaped ("don&#39;t")
export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
}

function decodeBase64(data: string) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

function extractHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string) {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
}

// Split on commas that are outside quotes and angle brackets ("Doe, John" <j@x.com>)
function splitAddresses(raw: string): string[] {
  const parts: string[] = []
  let current = ""
  let inQuotes = false
  let inAngle = false
  for (const ch of raw) {
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === "<" && !inQuotes) inAngle = true
    else if (ch === ">" && !inQuotes) inAngle = false
    if (ch === "," && !inQuotes && !inAngle) {
      parts.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts.map((p) => p.trim()).filter(Boolean)
}

function parseAddressList(raw: string): { email: string; name: string }[] {
  if (!raw) return []
  return splitAddresses(raw).map((addr) => {
    const angle = addr.match(/^(.*?)\s*<([^>]+)>$/)
    if (angle) {
      const name = angle[1].trim().replace(/^"(.*)"$/, "$1")
      return { name, email: angle[2].trim().toLowerCase() }
    }
    return { name: "", email: addr.replace(/^"(.*)"$/, "$1").toLowerCase() }
  })
}

function extractBody(payload: any): { html: string; text: string } {
  let html = ""
  let text = ""

  function walk(part: any) {
    const mime = part.mimeType ?? ""
    if (mime === "text/html" && part.body?.data) {
      if (!html) html = decodeBase64(part.body.data)
    } else if (mime === "text/plain" && part.body?.data) {
      if (!text) text = decodeBase64(part.body.data)
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
    fromName: fromParsed.name || fromParsed.email,
    to,
    cc,
    bcc,
    subject: extractHeader(headers, "subject"),
    bodyHtml: html,
    bodyText: text,
    snippet: decodeEntities(msg.snippet ?? ""),
    internalDate: new Date(Number(msg.internalDate)),
    isRead: !msg.labelIds?.includes("UNREAD"),
    isSent: !!msg.labelIds?.includes("SENT"),
    headers: headerMap,
    attachments: extractAttachments(msg.payload),
  }
}

// threads.get costs 10 quota units each, so cap how many run at once
const DETAIL_CONCURRENCY = 10

export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

export function isGmailQuotaError(err: unknown): boolean {
  const e = err as { code?: number; status?: number; message?: string }
  const status = e?.code ?? e?.status
  return status === 429 || (status === 403 && /quota|rate limit/i.test(e?.message ?? ""))
}

/**
 * `knownHistoryIds` maps gmailThreadId -> historyId already stored locally.
 * Threads whose historyId is unchanged are skipped, saving a threads.get call each.
 */
async function fetchThreadsWithClient(
  gmail: ReturnType<typeof google.gmail>,
  maxResults: number,
  pageToken?: string,
  q = "in:inbox",
  knownHistoryIds?: Map<string, string | null>,
  detailFormat: "full" | "metadata" = "full"
) {
  const res = await gmail.users.threads.list({
    userId: "me",
    maxResults,
    pageToken,
    q,
  })

  const threadList = (res.data.threads ?? []).filter(
    (t) => !t.historyId || knownHistoryIds?.get(t.id!) !== t.historyId
  )

  const threads = await mapWithConcurrency(threadList, DETAIL_CONCURRENCY, async (t) => {
    const detail = await gmail.users.threads.get({
      userId: "me",
      id: t.id!,
      format: detailFormat,
      ...(detailFormat === "metadata" && { metadataHeaders: ["From", "To", "Subject", "Date"] }),
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
      snippet: last?.snippet ?? decodeEntities(detail.data.snippet ?? ""),
      lastMessageAt: last?.internalDate ?? new Date(),
      participantEmails: uniqueParticipants.map((p) => p.email),
      participantNames: uniqueParticipants.map((p) => p.name),
      messageCount: messages.length,
      historyId: t.historyId ?? detail.data.historyId ?? null,
      messages,
    } satisfies GmailThread
  })

  return { threads, nextPageToken: res.data.nextPageToken }
}

export async function fetchThreadsForLinkedAccount(
  linkedAccountId: string,
  maxResults = 50,
  knownHistoryIds?: Map<string, string | null>
) {
  const gmail = await getLinkedGmailClient(linkedAccountId)
  return fetchThreadsWithClient(gmail, maxResults, undefined, "in:inbox", knownHistoryIds)
}

export async function fetchThreads(
  userId: string,
  maxResults = 50,
  pageToken?: string,
  knownHistoryIds?: Map<string, string | null>
) {
  const gmail = await getGmailClient(userId)
  return fetchThreadsWithClient(gmail, maxResults, pageToken, "in:inbox", knownHistoryIds)
}

export async function fetchThread(
  userId: string,
  gmailThreadId: string,
  accountEmail?: string | null
): Promise<GmailThread> {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
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
    historyId: detail.data.historyId ?? null,
    messages,
  }
}

// RFC 2047 encoding so non-ASCII subjects/names (emoji, accents) survive transport
function encodeHeader(value: string) {
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/** Look up the RFC 822 Message-ID / References of a Gmail message, for threading replies. */
async function getReplyHeaders(gmail: ReturnType<typeof google.gmail>, gmailMessageId: string) {
  try {
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: gmailMessageId,
      format: "metadata",
      metadataHeaders: ["Message-ID", "References"],
    })
    const headers = msg.data.payload?.headers ?? []
    return {
      messageId: extractHeader(headers, "message-id"),
      references: extractHeader(headers, "references"),
    }
  } catch {
    return { messageId: "", references: "" }
  }
}

export async function sendEmail(
  userId: string,
  opts: {
    to: string | string[]
    subject: string
    body: string
    replyToMessageId?: string
    threadId?: string
    accountEmail?: string | null
  }
) {
  const gmail = await getGmailClientForAccount(userId, opts.accountEmail)
  const userInfo = await gmail.users.getProfile({ userId: "me" })
  const from = userInfo.data.emailAddress!
  const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ]

  // replyToMessageId is Gmail's internal id; recipients' clients thread on the RFC Message-ID
  if (opts.replyToMessageId) {
    const { messageId, references } = await getReplyHeaders(gmail, opts.replyToMessageId)
    if (messageId) {
      headers.push(`In-Reply-To: ${messageId}`)
      headers.push(`References: ${[references, messageId].filter(Boolean).join(" ")}`)
    }
  }

  // Base64 body keeps long lines and non-ASCII text intact
  const body = Buffer.from(opts.body, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n")
  const raw = toBase64Url(headers.join("\r\n") + "\r\n\r\n" + body)

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw, threadId: opts.threadId },
  })

  return res.data
}

export async function markAsRead(userId: string, messageId: string, accountEmail?: string | null) {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  })
}

export async function setThreadRead(userId: string, threadId: string, read: boolean, accountEmail?: string | null) {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: read ? { removeLabelIds: ["UNREAD"] } : { addLabelIds: ["UNREAD"] },
  })
}

export async function archiveThread(userId: string, threadId: string, archive: boolean, accountEmail?: string | null) {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: archive ? { removeLabelIds: ["INBOX"] } : { addLabelIds: ["INBOX"] },
  })
}

export async function starThread(userId: string, threadId: string, star: boolean, accountEmail?: string | null) {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: star
      ? { addLabelIds: ["STARRED"] }
      : { removeLabelIds: ["STARRED"] },
  })
}

export async function deleteThread(userId: string, threadId: string, accountEmail?: string | null) {
  const gmail = await getGmailClientForAccount(userId, accountEmail)
  await gmail.users.threads.trash({ userId: "me", id: threadId })
}

export async function searchEmails(userId: string, query: string, maxResults = 20) {
  const gmail = await getGmailClient(userId)
  const res = await gmail.users.threads.list({ userId: "me", q: query, maxResults })
  return res.data.threads ?? []
}

export async function fetchTrashedThreads(userId: string, maxResults = 50) {
  const gmail = await getGmailClient(userId)
  return fetchThreadsWithClient(gmail, maxResults, undefined, "in:trash", undefined, "metadata")
}

export async function fetchSpamThreads(userId: string, maxResults = 50) {
  const gmail = await getGmailClient(userId)
  return fetchThreadsWithClient(gmail, maxResults, undefined, "in:spam", undefined, "metadata")
}

export async function restoreThread(userId: string, threadId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.untrash({ userId: "me", id: threadId })
}

export async function markNotSpam(userId: string, threadId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: { removeLabelIds: ["SPAM"], addLabelIds: ["INBOX"] },
  })
}

export async function permanentlyDeleteThread(userId: string, threadId: string) {
  const gmail = await getGmailClient(userId)
  await gmail.users.threads.delete({ userId: "me", id: threadId })
}
