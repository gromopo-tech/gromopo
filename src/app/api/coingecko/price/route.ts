// src/app/api/coingecko/price/route.ts
let cached: { data: Record<string, unknown>; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), { status: 200 });
  }

  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,solana,argentine-peso&vs_currencies=usd,ars';
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    return new Response('Failed to fetch price', { status: 500 });
  }
  const data = await res.json();
  cached = { data, timestamp: now };
  return new Response(JSON.stringify(data), { status: 200 });
}
