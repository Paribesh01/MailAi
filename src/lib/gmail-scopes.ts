import { prisma } from "@/lib/prisma"

export const REQUIRED_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
]

export async function hasRequiredGmailScopes(userId: string): Promise<boolean> {
  try {
    const account = await prisma.account.findFirst({
      where: { userId, providerId: "google" },
      select: { scope: true },
    })

    if (!account?.scope) return false

    const granted = account.scope.split(/[\s,]+/)
    return REQUIRED_GMAIL_SCOPES.every((s) => granted.includes(s))
  } catch {
    // DB connection error (e.g. Neon TLS drop) — let the user through;
    // individual API routes will surface real auth errors if scopes are missing.
    return true
  }
}
