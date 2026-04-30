import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      father_name,
      father_phone,
      board,
      standard,
      location,
    } = body;

    // ✅ Validation
    if (
      !name ||
      !phone ||
      !father_name ||
      !father_phone ||
      !board ||
      !standard ||
      !location
    ) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // ✅ Clean payload (avoid undefined)
    const payload = {
      name,
      phone,
      father_name,
      father_phone,
      board,
      standard,
      location,
    };

    // ✅ Correct backend call
    const res = await fetch(`${BACKEND}/admissions/public`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // ✅ Safe response parsing (VERY IMPORTANT)
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid backend response" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: res.status });

  } catch (err: any) {
    console.error("ADMISSION ERROR:", err.message);

    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}