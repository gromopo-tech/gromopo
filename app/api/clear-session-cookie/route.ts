import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Clear the session cookie by setting it to empty and expired
  const response = NextResponse.json({ success: true });
  response.cookies.set("__session", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
