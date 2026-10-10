import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function currentWorkspace(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase.from("workspace_members")
    .select("workspace_id, role, workspaces(id,name,slug)")
    .eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const membership = await currentWorkspace(supabase, userId);
    if (!membership) return NextResponse.json({ tasks: [], workspace: null });
    const { data, error } = await supabase.from("tasks")
      .select("id,title,description,status,priority,due_at,completed_at,created_at,wedding_id")
      .eq("workspace_id", membership.workspace_id)
      .order("due_at", { ascending: true, nullsFirst: false }).limit(100);
    if (error) throw error;
    return NextResponse.json({ tasks: data ?? [], workspace: membership.workspaces });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("title" in body) || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "A task title is required" }, { status: 400 });
    }
    const membership = await currentWorkspace(supabase, userId);
    if (!membership) return NextResponse.json({ error: "Create a workspace before adding tasks" }, { status: 409 });
    const input = body as { title: string; description?: string; priority?: string; due_at?: string | null; wedding_id?: string | null };
    const priorities = ["low", "normal", "high", "urgent"];
    const priority = input.priority && priorities.includes(input.priority) ? input.priority : "normal";
    const { data, error } = await supabase.from("tasks").insert({
      workspace_id: membership.workspace_id, created_by: userId,
      title: input.title.trim().slice(0, 180),
      description: typeof input.description === "string" ? input.description.slice(0, 4000) : null,
      priority, due_at: input.due_at || null, wedding_id: input.wedding_id || null,
    }).select("id,title,description,status,priority,due_at,completed_at,created_at,wedding_id").single();
    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create task" }, { status: 500 });
  }
}
