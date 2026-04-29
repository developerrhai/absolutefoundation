import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "https://institute-api.rhaitech.online/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${BACKEND}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}