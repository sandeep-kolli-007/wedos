import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function authorizedWedding() {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const { data: membership, error: membershipError } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return { response: NextResponse.json({ error: "Workspace not found" }, { status: 409 }) };
  return { supabase, userId, workspaceId: membership.workspace_id };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authorizedWedding();
    if ("response" in auth) return auth.response;
    const { data, error } = await auth.supabase.from("weddings")
      .select("id,title,couple_names,status,start_date,end_date,venue_name,venue_city,guest_count,budget,currency,notes,created_at,updated_at")
      .eq("id", id).eq("workspace_id", auth.workspaceId).maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    const [events, tasks, bookings, payments] = await Promise.all([
      auth.supabase.from("events").select("id,title,event_type,starts_at,ends_at,venue_name").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("starts_at", { ascending: true }).limit(20),
      auth.supabase.from("tasks").select("id,title,status,priority,due_at").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("due_at", { ascending: true }).limit(20),
      auth.supabase.from("vendor_bookings").select("id,service_description,quoted_amount,final_amount,status,vendors(business_name,category)").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).limit(20),
      auth.supabase.from("payment_milestones").select("id,title,amount,due_date,status,paid_at").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("due_date", { ascending: true }).limit(20),
    ]);
    if (events.error) throw events.error;
    if (tasks.error) throw tasks.error;
    if (bookings.error) throw bookings.error;
    if (payments.error) throw payments.error;
    return NextResponse.json({ wedding: data, events: events.data ?? [], tasks: tasks.data ?? [], vendor_bookings: bookings.data ?? [], payments: payments.data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load wedding" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authorizedWedding();
    if ("response" in auth) return auth.response;
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    const input = body as Record<string, unknown>;
    const allowed: Record<string, unknown> = {};
    for (const key of ["title","couple_names","status","start_date","end_date","venue_name","venue_city","guest_count","budget","notes"]) {
      if (key in input) allowed[key] = input[key];
    }
    if ("title" in allowed && (typeof allowed.title !== "string" || allowed.title.trim().length < 2)) return NextResponse.json({ error: "Title must be at least 2 characters" }, { status: 400 });
    if ("status" in allowed && !["lead","planning","confirmed","completed","archived"].includes(String(allowed.status))) return NextResponse.json({ error: "Invalid wedding status" }, { status: 400 });
    if ("budget" in allowed && (!Number.isFinite(Number(allowed.budget)) || Number(allowed.budget) < 0)) return NextResponse.json({ error: "Budget must be non-negative" }, { status: 400 });
    if ("title" in allowed) allowed.title = String(allowed.title).trim().slice(0, 160);
    allowed.updated_at = new Date().toISOString();
    const { data, error } = await auth.supabase.from("weddings").update(allowed)
      .eq("id", id).eq("workspace_id", auth.workspaceId)
      .select("id,title,couple_names,status,start_date,end_date,venue_name,venue_city,guest_count,budget,currency,notes,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    return NextResponse.json({ wedding: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update wedding" }, { status: 500 });
  }
}
