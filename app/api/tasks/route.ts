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
    const dueAt = input.due_at ? new Date(input.due_at) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: "Choose a valid task due date" }, { status: 400 });
    }
    const weddingId = typeof input.wedding_id === "string" && input.wedding_id.trim() ? input.wedding_id.trim() : null;
    if (weddingId) {
      const { data: wedding, error: weddingError } = await supabase.from("weddings")
        .select("id").eq("id", weddingId).eq("workspace_id", membership.workspace_id).maybeSingle();
      if (weddingError) throw weddingError;
      if (!wedding) return NextResponse.json({ error: "Wedding not found in this workspace" }, { status: 404 });
    }
    const { data, error } = await supabase.from("tasks").insert({
      workspace_id: membership.workspace_id, created_by: userId,
      title: input.title.trim().slice(0, 180),
      description: typeof input.description === "string" ? input.description.slice(0, 4000) : null,
      priority, due_at: dueAt?.toISOString() ?? null, wedding_id: weddingId,
    }).select("id,title,description,status,priority,due_at,completed_at,created_at,wedding_id").single();
    if (error) throw error;
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create task" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("id" in body) || typeof body.id !== "string" || !("done" in body) || typeof body.done !== "boolean") {
      return NextResponse.json({ error: "Task id and completion state are required" }, { status: 400 });
    }
    const membership = await currentWorkspace(supabase, userId);
    if (!membership) return NextResponse.json({ error: "Workspace not found" }, { status: 409 });
    const done = body.done;
    const { data, error } = await supabase.from("tasks").update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    }).eq("id", body.id).eq("workspace_id", membership.workspace_id)
      .select("id,status,completed_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ task: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update task" }, { status: 500 });
  }
}

