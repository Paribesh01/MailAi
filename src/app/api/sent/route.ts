import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
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
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })
  return google.gmail({ version: "v1", auth: oauth2Client })
}

function extractHeader(headers: Array<{ name?: string | null; value?: string | null }>, name: string) {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
}

function decodeBase64(data: string) {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
}

function extractBody(payload: any): string {
  let text = ""
  function walk(part: any) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      text = decodeBase64(part.body.data)
    } else if (part.parts) {
      part.parts.forEach(walk)
    }
  }
  walk(payload)
  return text
}

export async function GET() {
  try {
    const session = await requireSession()
    const gmail = await getGmailClient(session.user.id)

    const list = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SENT"],
      maxResults: 50,
    })

    const messages = list.data.messages ?? []

    const sent = await Promise.all(
      messages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "full",
        })
        const headers = msg.data.payload?.headers ?? []
        const to = extractHeader(headers, "to")
        const subject = extractHeader(headers, "subject") || "(no subject)"
        const date = new Date(Number(msg.data.internalDate))
        const bodyText = extractBody(msg.data.payload)
        return {
          id: m.id!,
          to,
          subject,
          snippet: msg.data.snippet ?? "",
          bodyText,
          date: date.toISOString(),
          threadId: msg.data.threadId ?? "",
        }
      })
    )

    return NextResponse.json({ sent })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
