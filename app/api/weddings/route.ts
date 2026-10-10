import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const { data: membership, error: membershipError } = await supabase.from("workspace_members")
      .select("workspace_id, workspaces(name)")
      .eq("user_id", userId).limit(1).maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return NextResponse.json({ weddings: [], workspace: null });
    const { data, error } = await supabase.from("weddings")
      .select("id,title,couple_names,status,start_date,end_date,venue_name,venue_city,guest_count,budget,currency,created_at")
      .eq("workspace_id", membership.workspace_id)
      .order("start_date", { ascending: true, nullsFirst: false });
    if (error) throw error;
    return NextResponse.json({ weddings: data ?? [], workspace: membership.workspaces });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load weddings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;
    if (claimsError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("title" in body) || typeof body.title !== "string" || body.title.trim().length < 2) {
      return NextResponse.json({ error: "Wedding title is required" }, { status: 400 });
    }
    const membership = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
    if (membership.error) throw membership.error;
    if (!membership.data) return NextResponse.json({ error: "Create a workspace before adding weddings" }, { status: 409 });
    const input = body as { title: string; couple_names?: string; start_date?: string; end_date?: string; venue_name?: string; venue_city?: string; guest_count?: number; budget?: number };
    const budget = Number(input.budget ?? 0);
    if (!Number.isFinite(budget) || budget < 0) return NextResponse.json({ error: "Budget must be a non-negative amount" }, { status: 400 });
    const guestCount = input.guest_count === undefined ? null : Number(input.guest_count);
    if (guestCount !== null && (!Number.isInteger(guestCount) || guestCount < 0)) return NextResponse.json({ error: "Guest count must be a non-negative whole number" }, { status: 400 });
    if (input.start_date && input.end_date && input.end_date < input.start_date) return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
    const { data, error } = await supabase.from("weddings").insert({
      workspace_id: membership.data.workspace_id,
      created_by: userId,
      title: input.title.trim().slice(0, 160),
      couple_names: typeof input.couple_names === "string" ? input.couple_names.trim().slice(0, 160) : null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      venue_name: typeof input.venue_name === "string" ? input.venue_name.trim().slice(0, 180) : null,
      venue_city: typeof input.venue_city === "string" ? input.venue_city.trim().slice(0, 100) : null,
      guest_count: guestCount,
      budget,
    }).select("id,title,couple_names,status,start_date,end_date,venue_name,venue_city,guest_count,budget,currency,created_at").single();
    if (error) throw error;
    return NextResponse.json({ wedding: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create wedding" }, { status: 500 });
  }
}
