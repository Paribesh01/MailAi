import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await requireSession()

    const rules = await prisma.senderRule.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(rules)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { senderPattern, action } = body

    if (!senderPattern || typeof senderPattern !== "string") {
      return NextResponse.json({ error: "senderPattern is required" }, { status: 400 })
    }

    const validActions = ["NEEDS_ATTENTION", "CAN_WAIT", "IGNORE"] as const
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(", ")}` },
        { status: 400 }
      )
    }

    const rule = await prisma.senderRule.create({
      data: {
        senderPattern: senderPattern.trim(),
        action,
        userId: session.user.id,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 })
    }

    const rule = await prisma.senderRule.findUnique({ where: { id } })

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    if (rule.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.senderRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
