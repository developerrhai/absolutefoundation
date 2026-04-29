import { NextRequest, NextResponse } from "next/server";

// ✅ Always keep base URL only (NO /api here)
const BACKEND =
  process.env.BACKEND_URL || "https://institute-api.rhaitech.online/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ Validate required fields
    const { studentName, studentContact, parentContact } = body;

    if (!studentName || !studentContact || !parentContact) {
      return NextResponse.json(
        { success: false, message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // ✅ Map frontend → backend payload
    const inquiryPayload = {
      name: studentName,
      phone: studentContact,
      father_name: "", // optional
      father_phone: parentContact,
      course: body.batch || "",
      location: "", // optional
      board: "",
      standard: body.standard || "",
      status: "New",
      video: "",
      extra: {
        dob: body.dob || "",
        email: body.email || "",
        address: body.address || "",
        collegeName: body.collegeName || "",
        collegeTiming: body.collegeTiming || "",
        lastExamMarks: body.lastExamMarks || "",
        fatherOccupation: body.fatherOccupation || "",
        motherOccupation: body.motherOccupation || "",
        futurePlans: body.futurePlans || "",
        reference: body.reference || "",
        siblingName: body.siblingName || "",
        sex: body.sex || "",
        takingCoaching: body.takingCoaching || "",
        hostelRequired: body.hostelRequired || "",
      },
    };

    // ✅ Correct backend call
    const res = await fetch(`${BACKEND}/inquiries/public`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inquiryPayload),
    });

    // ✅ Handle non-JSON safely
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response from backend" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: res.status });

  } catch (err: any) {
    console.error("Inquiry API ERROR:", err.message);

    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}