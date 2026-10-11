import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function workspaceContext() {
  const supabase = await createSupabaseServerClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || !userId) return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const { data: membership, error } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (!membership) return { response: NextResponse.json({ error: "Create a workspace before managing design assets" }, { status: 409 }) };
  return { supabase, userId, workspaceId: membership.workspace_id };
}

export async function GET() {
  try {
    const context = await workspaceContext();
    if ("response" in context) return context.response;
    const { data, error } = await context.supabase.from("design_assets")
      .select("id,wedding_id,title,asset_type,status,preview_url,version,created_at,updated_at,weddings(title,couple_names)")
      .eq("workspace_id", context.workspaceId).order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ assets: data ?? [] });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to load design assets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await workspaceContext();
    if ("response" in context) return context.response;
    const input: unknown = await request.json();
    if (!input || typeof input !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const body = input as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const weddingId = typeof body.wedding_id === "string" ? body.wedding_id : "";
    const assetType = typeof body.asset_type === "string" ? body.asset_type : "moodboard";
    const allowedTypes = ["moodboard", "invitation", "itinerary", "signage", "social_post", "other"];
    if (title.length < 2) return NextResponse.json({ error: "Enter a design title with at least 2 characters" }, { status: 400 });
    if (!weddingId) return NextResponse.json({ error: "Choose a wedding workspace" }, { status: 400 });
    if (!allowedTypes.includes(assetType)) return NextResponse.json({ error: "Choose a valid design type" }, { status: 400 });
    const { data: wedding, error: weddingError } = await context.supabase.from("weddings").select("id").eq("id", weddingId).eq("workspace_id", context.workspaceId).maybeSingle();
    if (weddingError) throw weddingError;
    if (!wedding) return NextResponse.json({ error: "Wedding not found in this workspace" }, { status: 404 });
    const { data, error } = await context.supabase.from("design_assets").insert({
      workspace_id: context.workspaceId, wedding_id: weddingId, title, asset_type: assetType, status: "draft", created_by: context.userId
    }).select("id,wedding_id,title,asset_type,status,preview_url,version,created_at,updated_at,weddings(title,couple_names)").single();
    if (error) throw error;
    return NextResponse.json({ asset: data }, { status: 201 });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to create design asset" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await workspaceContext();
    if ("response" in context) return context.response;
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || !("id" in input) || typeof input.id !== "string" || !("status" in input) || typeof input.status !== "string") {
      return NextResponse.json({ error: "Asset id and status are required" }, { status: 400 });
    }
    const body = input as { id: string; status: string };
    const allowed = ["draft", "in_review", "approved", "published", "archived"];
    if (!allowed.includes(body.status)) return NextResponse.json({ error: "Invalid design status" }, { status: 400 });
    const { data, error } = await context.supabase.from("design_assets").update({
      status: body.status,
      approved_by: body.status === "approved" ? context.userId : null,
      approved_at: body.status === "approved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", body.id).eq("workspace_id", context.workspaceId)
      .select("id,wedding_id,title,asset_type,status,preview_url,version,created_at,updated_at,weddings(title,couple_names)").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Design asset not found" }, { status: 404 });
    return NextResponse.json({ asset: data });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to update design asset" }, { status: 500 });
  }
}
