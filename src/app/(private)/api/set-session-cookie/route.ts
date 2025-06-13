import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Set the cookie directly using NextResponse
    response.cookies.set("__session", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to set cookie" }, { status: 500 });
  }
}