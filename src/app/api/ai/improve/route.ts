import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/session"
import { improvedraft } from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    await requireSession()
    const { draft, instruction } = await req.json()
    const improved = await improvedraft(draft, instruction)
    return NextResponse.json({ draft: improved })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
