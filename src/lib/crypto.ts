import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto"

// Derives a unique 256-bit key per user so one user's data cannot decrypt another's.
// The master ENCRYPTION_SECRET never touches the DB — only derived keys are used.
function deriveKey(userId: string): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret) throw new Error("ENCRYPTION_SECRET is not configured")
  return createHmac("sha256", secret).update(userId).digest()
}

// Encrypted format: "enc:<iv>:<authTag>:<ciphertext>" (base64url segments)
// The "enc:" prefix lets safeDecrypt distinguish encrypted values from plain text.
export function encrypt(plaintext: string, userId: string): string {
  const key = deriveKey(userId)
  const iv = randomBytes(12) // 96-bit IV recommended for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `enc:${iv.toString("base64url")}:${authTag.toString("base64url")}:${ciphertext.toString("base64url")}`
}

export function decrypt(encrypted: string, userId: string): string {
  const parts = encrypted.split(":")
  if (parts.length !== 4 || parts[0] !== "enc") return encrypted // Not our format
  const [, ivB64, tagB64, ctB64] = parts
  const key = deriveKey(userId)
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

// Safe wrapper: returns plaintext as-is if not encrypted (handles existing DB rows).
export function safeDecrypt(value: string | null | undefined, userId: string): string | null {
  if (!value) return value ?? null
  if (!value.startsWith("enc:")) return value
  try {
    return decrypt(value, userId)
  } catch {
    return value
  }
}

// Decrypt all sensitive fields on an email row before returning to caller / AI.
export function decryptEmail<
  T extends { bodyHtml?: string | null; bodyText?: string | null; snippet: string }
>(email: T, userId: string): T {
  return {
    ...email,
    bodyHtml: safeDecrypt(email.bodyHtml, userId),
    bodyText: safeDecrypt(email.bodyText, userId),
    snippet: safeDecrypt(email.snippet, userId) ?? email.snippet,
  }
}

// Decrypt all sensitive fields on a thread row (including nested emails).
export function decryptThread<
  T extends {
    snippet: string
    aiSummary?: string | null
    emails?: { bodyHtml?: string | null; bodyText?: string | null; snippet: string }[]
  }
>(thread: T, userId: string): T {
  return {
    ...thread,
    snippet: safeDecrypt(thread.snippet, userId) ?? thread.snippet,
    aiSummary: safeDecrypt(thread.aiSummary, userId),
    emails: thread.emails?.map((e) => decryptEmail(e, userId)),
  }
}
