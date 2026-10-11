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
      auth.supabase.from("events").select("id,title,event_type,starts_at,ends_at,venue_name").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("starts_at", { ascending: true }).limit(50),
      auth.supabase.from("tasks").select("id,title,status,priority,due_at").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("due_at", { ascending: true }).limit(50),
      auth.supabase.from("vendor_bookings").select("id,service_description,quoted_amount,final_amount,status,vendors(business_name,category)").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).limit(50),
      auth.supabase.from("payment_milestones").select("id,title,amount,due_date,status,paid_at").eq("wedding_id", id).eq("workspace_id", auth.workspaceId).order("due_date", { ascending: true }).limit(50),
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = await authorizedWedding();
    if ("response" in auth) return auth.response;
    const { data: wedding, error: weddingError } = await auth.supabase.from("weddings")
      .select("id").eq("id", id).eq("workspace_id", auth.workspaceId).maybeSingle();
    if (weddingError) throw weddingError;
    if (!wedding) return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (typeof input.title !== "string" || input.title.trim().length < 2) {
      return NextResponse.json({ error: "Enter a title with at least 2 characters" }, { status: 400 });
    }
    const title = input.title.trim().slice(0, 180);
    if (input.type === "event") {
      const startsAt = typeof input.starts_at === "string" && input.starts_at ? new Date(input.starts_at) : null;
      if (startsAt && Number.isNaN(startsAt.getTime())) return NextResponse.json({ error: "Choose a valid event date and time" }, { status: 400 });
      const { data, error } = await auth.supabase.from("events").insert({
        workspace_id: auth.workspaceId, wedding_id: id, title,
        event_type: typeof input.event_type === "string" ? input.event_type.slice(0, 60) : "other",
        starts_at: startsAt?.toISOString() ?? null,
        venue_name: typeof input.venue_name === "string" && input.venue_name.trim() ? input.venue_name.trim().slice(0, 180) : null,
      }).select("id,title,event_type,starts_at,ends_at,venue_name").single();
      if (error) throw error;
      return NextResponse.json({ event: data }, { status: 201 });
    }
    if (input.type === "vendor_booking") {
      const vendorName = typeof input.vendor_name === "string" ? input.vendor_name.trim().slice(0, 180) : "";
      const category = typeof input.category === "string" ? input.category.trim().slice(0, 80) : "";
      const service = typeof input.service_description === "string" && input.service_description.trim() ? input.service_description.trim().slice(0, 240) : title;
      const amount = Number(input.quoted_amount ?? 0);
      if (vendorName.length < 2 || category.length < 2) return NextResponse.json({ error: "Enter a vendor name and category" }, { status: 400 });
      if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999) return NextResponse.json({ error: "Enter a valid non-negative quote" }, { status: 400 });
      let { data: vendor, error: vendorLookupError } = await auth.supabase.from("vendors").select("id").eq("workspace_id", auth.workspaceId).ilike("business_name", vendorName).limit(1).maybeSingle();
      if (vendorLookupError) throw vendorLookupError;
      if (!vendor) {
        const createdVendor = await auth.supabase.from("vendors").insert({ workspace_id: auth.workspaceId, business_name: vendorName, category }).select("id").single();
        if (createdVendor.error) throw createdVendor.error;
        vendor = createdVendor.data;
      }
      const { data, error } = await auth.supabase.from("vendor_bookings").insert({ workspace_id: auth.workspaceId, wedding_id: id, vendor_id: vendor.id, service_description: service, quoted_amount: amount, status: "proposed" }).select("id,service_description,quoted_amount,final_amount,status,vendors(business_name,category)").single();
      if (error) throw error;
      return NextResponse.json({ vendor_booking: data }, { status: 201 });
    }
    if (input.type === "payment") {
      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999) return NextResponse.json({ error: "Enter a valid non-negative amount" }, { status: 400 });
      const dueDate = typeof input.due_date === "string" && input.due_date ? input.due_date : null;
      if (dueDate && (dueDate.length !== 10 || dueDate.split("-").length !== 3 || dueDate.split("-").some(part => !/^\\d+$/.test(part)))) return NextResponse.json({ error: "Choose a valid due date" }, { status: 400 });
      const { data, error } = await auth.supabase.from("payment_milestones").insert({ workspace_id: auth.workspaceId, wedding_id: id, title, amount, due_date: dueDate, status: "planned" }).select("id,title,amount,due_date,status,paid_at").single();
      if (error) throw error;
      return NextResponse.json({ payment: data }, { status: 201 });
    }
    if (input.type === "task") {
      const priorities = ["low", "normal", "high", "urgent"];
      const priority = typeof input.priority === "string" && priorities.includes(input.priority) ? input.priority : "normal";
      const dueAt = typeof input.due_at === "string" && input.due_at ? new Date(input.due_at) : null;
      if (dueAt && Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "Choose a valid task due date" }, { status: 400 });
      const { data, error } = await auth.supabase.from("tasks").insert({
        workspace_id: auth.workspaceId, wedding_id: id, created_by: auth.userId,
        title, priority, due_at: dueAt?.toISOString() ?? null,
      }).select("id,title,status,priority,due_at").single();
      if (error) throw error;
      return NextResponse.json({ task: data }, { status: 201 });
    }
    return NextResponse.json({ error: "Choose an event or task" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create item" }, { status: 500 });
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
    if ("guest_count" in allowed && allowed.guest_count !== null && (!Number.isInteger(Number(allowed.guest_count)) || Number(allowed.guest_count) < 0)) return NextResponse.json({ error: "Guest count must be a non-negative whole number" }, { status: 400 });
    if ("title" in allowed) allowed.title = String(allowed.title).trim().slice(0, 160);
    if ("start_date" in allowed && "end_date" in allowed && allowed.start_date && allowed.end_date && String(allowed.end_date) < String(allowed.start_date)) return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
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
