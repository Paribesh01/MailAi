export type EmailCategory = "NEEDS_ATTENTION" | "CAN_WAIT" | "IGNORE"

export interface Label {
  id: string
  name: string
  color: string
}

export interface FollowUp {
  id: string
  scheduledFor: string
  message: string | null
  isDone: boolean
  aiGenerated: boolean
}

export interface Thread {
  id: string
  gmailThreadId: string
  subject: string
  snippet: string
  category: EmailCategory
  isRead: boolean
  isStarred: boolean
  isArchived: boolean
  isSnoozed: boolean
  snoozedUntil: string | null
  hasFollowUp: boolean
  lastMessageAt: string
  participantEmails: string[]
  participantNames: string[]
  messageCount: number
  aiSummary: string | null
  labels: Array<{ label: Label }>
  followUps?: FollowUp[]
  _count?: { emails: number }
}

export interface Email {
  id: string
  gmailMessageId: string
  from: string
  fromName: string | null
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  bodyHtml: string | null
  bodyText: string | null
  snippet: string
  isRead: boolean
  isDraft: boolean
  isSent: boolean
  internalDate: string
  attachments: Attachment[]
}

export interface Attachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface ThreadDetail extends Thread {
  emails: Email[]
}
