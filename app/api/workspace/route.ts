import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const { data, error } = await supabase.from("workspace_members")
      .select("role, workspaces(id,name,slug,currency,timezone)")
      .eq("user_id", userId).limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ membership: data ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load workspace" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("name" in body) || typeof body.name !== "string") {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }
    const name = body.name.trim().slice(0, 80);
    if (name.length < 2) return NextResponse.json({ error: "Workspace name must be at least 2 characters" }, { status: 400 });
    const slug = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "studio";
    const { data, error } = await supabase.rpc("create_workspace_for_current_user", { workspace_name: name, workspace_slug: slug });
    if (error) throw error;
    return NextResponse.json({ workspace_id: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create workspace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
