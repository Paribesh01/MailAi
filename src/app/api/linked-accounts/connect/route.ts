import { NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { createHmac } from "crypto"

function signState(userId: string): string {
  const payload = `${userId}:${Date.now()}`
  const sig = createHmac("sha256", process.env.ENCRYPTION_SECRET!)
    .update(payload)
    .digest("hex")
  return Buffer.from(`${payload}:${sig}`).toString("base64url")
}

export async function GET() {
  const session = await requireSession()

  const state = signState(session.user.id)
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linked-accounts/callback`

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels",
  ].join(" "))
  url.searchParams.set("access_type", "offline")
  url.searchParams.set("prompt", "consent select_account")
  url.searchParams.set("state", state)

  return NextResponse.redirect(url.toString())
}
