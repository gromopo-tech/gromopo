import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ragApiUrl = process.env.RAG_API_URL;
  
  if (!ragApiUrl) {
    return NextResponse.json({ error: "RAG API URL not configured" }, { status: 500 });
  }
  
  // Determine if we're streaming based on the request
  const useStreaming = body.streaming === true;
  const endpoint = `${ragApiUrl.replace(/\/+$/, "")}/${useStreaming ? "rag/streaming-query" : "query"}`;

  // Forward businessId for per-tenant retrieval scoping
  const upstreamPayload: Record<string, unknown> = { query: body.query };
  if (body.businessId) {
    upstreamPayload.business_id = body.businessId;
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
    // For streaming, return a proxy that forwards exactly what we get
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
          
          // Just pipe through the raw data
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
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
}