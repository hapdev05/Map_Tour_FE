import { NextRequest } from "next/server";

const BASE =
  process.env.TRAVEL_BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const tail = path.join("/");
  const url = `${BASE}/${tail}${req.nextUrl.search}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy error";
    return Response.json(
      { error: "Không kết nối được backend", detail: message, url },
      { status: 502 }
    );
  }
}
