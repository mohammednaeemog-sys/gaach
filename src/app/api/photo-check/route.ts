import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/accounts/session";
import { checkPhoto, MAX_IMAGE_CHARS, PhotoCheckError } from "@/modules/assistant/photo";

const body = z.object({
  image: z.string().max(MAX_IMAGE_CHARS, "That photo is too large."),
  note: z.string().trim().max(500).optional().default(""),
  conversationId: z.string().max(40).nullish(),
  treeSlug: z.string().max(60).nullish(),
});

// At most 5 photo checks a minute per user (the free Gemini limit is small)
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to use the photo check." }, { status: 401 });
  const raw = await req.text();
  if (raw.length > MAX_IMAGE_CHARS + 4000) return NextResponse.json({ error: "That photo is too large." }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(raw); } catch { /* handled below */ }
  const parsed = body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });

  const now = Date.now();
  const list = (recent.get(user.id) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= 5) return NextResponse.json({ error: "Please wait a minute before checking another photo." }, { status: 429 });
  recent.set(user.id, [...list, now]);

  const { image, note, treeSlug } = parsed.data;
  const tree = treeSlug ? await db.tree.findFirst({ where: { slug: treeSlug, published: true } }) : null;
  try {
    const { reply, sources } = await checkPhoto({ image, note, treeName: tree?.name });
    // Keep the chat history, but never the photo itself
    const asked = `📷 [photo]${note ? ` ${note}` : ""}`;
    let convo = parsed.data.conversationId ? await db.conversation.findFirst({ where: { id: parsed.data.conversationId, userId: user.id } }) : null;
    if (!convo) convo = await db.conversation.create({ data: { userId: user.id, title: note ? `Photo: ${note.slice(0, 50)}` : "Photo check", treeId: tree?.id ?? null } });
    await db.chatMessage.create({ data: { conversationId: convo.id, role: "user", content: asked, intent: "photo_check" } });
    await db.chatMessage.create({ data: { conversationId: convo.id, role: "assistant", content: reply, tools: "photo_check", sources: JSON.stringify(sources) } });
    await db.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } });
    return NextResponse.json({ conversationId: convo.id, reply, sources, mode: "ai", refused: false });
  } catch (e) {
    if (e instanceof PhotoCheckError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("photo check failed", e);
    return NextResponse.json({ error: "The photo check failed. Please try again, or describe the problem in words." }, { status: 500 });
  }
}
