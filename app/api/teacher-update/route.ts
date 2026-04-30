import { NextRequest, NextResponse } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const required = ["teacher_name","batch","subject","chapter","topic","branch","class_date","class_time"]
    for (const field of required) {
      if (!body[field]?.toString().trim()) {
        return NextResponse.json(
          { success: false, message: `${field.replace("_"," ")} is required` },
          { status: 400 }
        )
      }
    }

    const res  = await fetch(`${BACKEND}/teacher-updates/public`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error("Teacher update API error:", err)
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    )
  }
}
