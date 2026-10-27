import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/accounts/session";
import { chat, RateLimitError } from "@/modules/assistant/service";

const body = z.object({
  message: z.string().trim().min(1, "Type a question first.").max(1500, "Keep questions under 1500 characters."),
  conversationId: z.string().max(40).nullish(),
  treeSlug: z.string().max(60).nullish(),
  ownedId: z.string().max(40).nullish(),
});

export async function POST(req: Request) {
  // The user always comes from the session, never from the request body (NFR-3.2)
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to use the assistant." }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 8000) return NextResponse.json({ error: "That request is too large." }, { status: 413 });
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    /* handled below */
  }
  const parsed = body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  try {
    const result = await chat({ userId: user.id, ...parsed.data });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof RateLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
    console.error("chat route failed", e);
    const detail = process.env.NODE_ENV !== "production" && e instanceof Error ? ` (${e.message})` : "";
    return NextResponse.json({ error: `The assistant could not answer just now. The rest of the site still works; please try again.${detail}` }, { status: 500 });
  }
}
