import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Context = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  userId: string;
  workspaceId: string;
};

async function getContext(): Promise<{ context: Context } | { response: NextResponse }> {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const { data: membership, error } = await supabase.from("workspace_members")
    .select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (!membership) return { response: NextResponse.json({ error: "Create a workspace before managing guests" }, { status: 409 }) };
  return { context: { supabase, userId, workspaceId: membership.workspace_id } };
}

export async function GET(request: Request) {
  try {
    const result = await getContext();
    if ("response" in result) return result.response;
    const { context } = result;
    const url = new URL(request.url);
    const weddingId = url.searchParams.get("wedding_id");
    let query = context.supabase.from("guests")
      .select("id,wedding_id,first_name,last_name,email,phone,side,rsvp_status,party_size,dietary_notes,notes,created_at,updated_at")
      .eq("workspace_id", context.workspaceId)
      .order("last_name", { ascending: true }).order("first_name", { ascending: true });
    if (weddingId) query = query.eq("wedding_id", weddingId);
    const { data, error } = await query.limit(1000);
    if (error) throw error;
    return NextResponse.json({ guests: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load guests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await getContext();
    if ("response" in result) return result.response;
    const { context } = result;
    const body = await request.json() as Record<string, unknown>;
    const firstName = typeof body.first_name === "string" ? body.first_name.trim().slice(0, 80) : "";
    const weddingId = typeof body.wedding_id === "string" ? body.wedding_id : "";
    if (firstName.length < 1) return NextResponse.json({ error: "Guest first name is required" }, { status: 400 });
    if (!weddingId) return NextResponse.json({ error: "Choose a wedding for this guest" }, { status: 400 });
    const { data: wedding, error: weddingError } = await context.supabase.from("weddings")
      .select("id").eq("id", weddingId).eq("workspace_id", context.workspaceId).maybeSingle();
    if (weddingError) throw weddingError;
    if (!wedding) return NextResponse.json({ error: "Wedding not found in this workspace" }, { status: 404 });
    const side = ["bride", "groom", "shared", "other"].includes(String(body.side)) ? String(body.side) : "other";
    const status = ["pending", "invited", "attending", "declined"].includes(String(body.rsvp_status)) ? String(body.rsvp_status) : "pending";
    const partySize = Number(body.party_size ?? 1);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) return NextResponse.json({ error: "Party size must be between 1 and 20" }, { status: 400 });
    const clean = (value: unknown, max: number) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
    const { data, error } = await context.supabase.from("guests").insert({
      workspace_id: context.workspaceId, wedding_id: weddingId, created_by: context.userId,
      first_name: firstName, last_name: clean(body.last_name, 80), email: clean(body.email, 254),
      phone: clean(body.phone, 40), side, rsvp_status: status, party_size: partySize,
      dietary_notes: clean(body.dietary_notes, 500), notes: clean(body.notes, 2000),
    }).select("id,wedding_id,first_name,last_name,email,phone,side,rsvp_status,party_size,dietary_notes,notes,created_at,updated_at").single();
    if (error) throw error;
    return NextResponse.json({ guest: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to add guest" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getContext();
    if ("response" in result) return result.response;
    const { context } = result;
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.id !== "string" || !body.id) return NextResponse.json({ error: "Guest id is required" }, { status: 400 });
    const allowed: Record<string, unknown> = {};
    if ("rsvp_status" in body) {
      if (!["pending", "invited", "attending", "declined"].includes(String(body.rsvp_status))) return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
      allowed.rsvp_status = body.rsvp_status;
    }
    if ("party_size" in body) {
      const size = Number(body.party_size);
      if (!Number.isInteger(size) || size < 1 || size > 20) return NextResponse.json({ error: "Party size must be between 1 and 20" }, { status: 400 });
      allowed.party_size = size;
    }
    if (!Object.keys(allowed).length) return NextResponse.json({ error: "No supported guest changes provided" }, { status: 400 });
    allowed.updated_at = new Date().toISOString();
    const { data, error } = await context.supabase.from("guests").update(allowed)
      .eq("id", body.id).eq("workspace_id", context.workspaceId)
      .select("id,wedding_id,first_name,last_name,rsvp_status,party_size,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    return NextResponse.json({ guest: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update guest" }, { status: 500 });
  }
}
