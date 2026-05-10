import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/adminConfig";

export async function POST(req: NextRequest) {
  const ragApiUrl = process.env.RAG_API_URL;
  if (!ragApiUrl) {
    return NextResponse.json({ error: "RAG API URL not configured" }, { status: 500 });
  }

  // Verify Firebase ID token and derive businessId from claims (not request body)
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
  }
  const idToken = authHeader.replace("Bearer ", "");
  let businessId: string | null = null;
  let businessName: string | null = null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    businessId = decoded.businessId || null;
    businessName = decoded.businessName || null;
  } catch {
    return NextResponse.json({ error: "Invalid or expired ID token" }, { status: 401 });
  }

  const body = await req.json();

  // Use only the origin so the env var value is insensitive to trailing paths/slashes
  const baseUrl = new URL(ragApiUrl).origin;

  const useStreaming = body.streaming === true;
  const endpoint = `${baseUrl}/${useStreaming ? "rag/streaming-query" : "query"}`;

  const upstreamPayload: Record<string, unknown> = { query: body.query };
  if (businessId) {
    upstreamPayload.business_id = businessId;
  }
  if (businessName) {
    upstreamPayload.business_name = businessName;
  }

  if (!useStreaming) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamPayload),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } else {
    return new Response(
      new ReadableStream({
        async start(controller) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(upstreamPayload),
          });

          const reader = res.body?.getReader();
          if (!reader) {
            controller.error(new Error("No readable stream from RAG API"));
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }
}
