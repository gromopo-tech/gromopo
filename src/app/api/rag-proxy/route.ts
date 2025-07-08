import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/adminConfig";

export async function POST(req: NextRequest) {
  // Get the Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }
  const idToken = authHeader.split(" ")[1];
  try {
    // Verify the Firebase ID token
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const body = await req.json();
  const res = await fetch("https://rag-api-185581376798.us-central1.run.app/rag/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
} 