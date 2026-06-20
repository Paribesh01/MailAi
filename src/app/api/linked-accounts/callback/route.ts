import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHmac } from "crypto"

function verifyState(state: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString()
    const parts = decoded.split(":")
    if (parts.length !== 3) return null
    const [userId, ts, sig] = parts
    const age = Date.now() - Number(ts)
    if (age > 10 * 60 * 1000) return null // 10 min expiry
    const expected = createHmac("sha256", process.env.ENCRYPTION_SECRET!)
      .update(`${userId}:${ts}`)
      .digest("hex")
    if (sig !== expected) return null
    return userId
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?linked=error`)
  }

  const userId = verifyState(state)
  if (!userId) {
    return NextResponse.redirect(`${appUrl}/settings?linked=error`)
  }

  const redirectUri = `${appUrl}/api/linked-accounts/callback`

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings?linked=error`)
  }

  const tokens = await tokenRes.json()

  // Get Google profile
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings?linked=error`)
  }

  const profile = await profileRes.json()

  // Prevent linking the primary account again
  const primaryAccount = await prisma.account.findFirst({
    where: { userId, providerId: "google" },
    include: { user: { select: { email: true } } },
  })
  if (primaryAccount?.user.email === profile.email) {
    return NextResponse.redirect(`${appUrl}/settings?linked=primary`)
  }

  await prisma.linkedAccount.upsert({
    where: { userId_email: { userId, email: profile.email } },
    create: {
      userId,
      email: profile.email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scope: tokens.scope ?? null,
    },
    update: {
      name: profile.name ?? null,
      image: profile.picture ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
      scope: tokens.scope ?? null,
    },
  })

  return NextResponse.redirect(`${appUrl}/settings?linked=success&email=${encodeURIComponent(profile.email)}`)
}
