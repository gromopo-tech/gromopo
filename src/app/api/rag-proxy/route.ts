import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ragApiUrl = process.env.RAG_API_URL;
  if (!ragApiUrl) {
    return NextResponse.json({ error: "RAG API URL not configured" }, { status: 500 });
  }
  const res = await fetch(ragApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
} 