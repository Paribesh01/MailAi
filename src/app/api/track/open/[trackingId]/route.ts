import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(_req: NextRequest, { params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params
  try {
    await prisma.emailTrack.update({
      where: { trackingId },
      data: {
        openCount: { increment: 1 },
        openedAt: undefined, // only set first time below
      },
    })
    // Set openedAt only on first open
    const track = await prisma.emailTrack.findUnique({ where: { trackingId } })
    if (track && !track.openedAt) {
      await prisma.emailTrack.update({
        where: { trackingId },
        data: { openedAt: new Date() },
      })
    }
  } catch {
    // silently ignore — don't break email rendering
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
