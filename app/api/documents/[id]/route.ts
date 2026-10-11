import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data: claims, error: authError } = await supabase.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (authError || !userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const { data: memberships, error: membershipError } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId);
    if (membershipError) throw membershipError;
    const workspaceIds = (memberships ?? []).map(item => item.workspace_id);
    if (!workspaceIds.length) return NextResponse.json({ error: "Workspace not found" }, { status: 409 });
    const { data: document, error } = await supabase.from("documents").select("id,title,storage_path").eq("id", id).in("workspace_id", workspaceIds).maybeSingle();
    if (error) throw error;
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    const { data, error: signedError } = await supabase.storage.from("wedos-documents").createSignedUrl(document.storage_path, 60, { download: document.title });
    if (signedError) throw signedError;
    return NextResponse.json({ url: data.signedUrl });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to create document link" }, { status: 500 });
  }
}
