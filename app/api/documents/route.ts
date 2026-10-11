import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const allowedTypes = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const typeNames: Record<string,string> = { "application/pdf":"pdf", "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"xlsx" };

async function getContext() {
  const supabase = await createSupabaseServerClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (authError || !userId) return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const { data: membership, error } = await supabase.from("workspace_members").select("workspace_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw error;
  if (!membership) return { response: NextResponse.json({ error: "Create a workspace before uploading documents" }, { status: 409 }) };
  return { supabase, userId, workspaceId: membership.workspace_id };
}

export async function GET() {
  try {
    const context = await getContext();
    if ("response" in context) return context.response;
    const { data, error } = await context.supabase.from("documents")
      .select("id,wedding_id,title,document_type,storage_path,uploaded_by,created_at,weddings(title)")
      .eq("workspace_id", context.workspaceId).order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return NextResponse.json({ documents: data ?? [] });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to load documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let uploadedPath: string | null = null;
  try {
    const context = await getContext();
    if ("response" in context) return context.response;
    const form = await request.formData();
    const file = form.get("file");
    const titleInput = form.get("title");
    const typeInput = form.get("document_type");
    const weddingInput = form.get("wedding_id");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a document to upload" }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Files must be 20 MB or smaller" }, { status: 413 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Upload a PDF, JPG, PNG, WebP, DOCX or XLSX file" }, { status: 415 });
    const title = typeof titleInput === "string" && titleInput.trim() ? titleInput.trim().slice(0, 160) : file.name.slice(0, 160);
    const documentType = typeof typeInput === "string" && typeInput.trim() ? typeInput.trim().slice(0, 60) : "other";
    const weddingId = typeof weddingInput === "string" && weddingInput ? weddingInput : null;
    if (weddingId) {
      const { data: wedding, error } = await context.supabase.from("weddings").select("id").eq("id", weddingId).eq("workspace_id", context.workspaceId).maybeSingle();
      if (error) throw error;
      if (!wedding) return NextResponse.json({ error: "Wedding not found in this workspace" }, { status: 404 });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || ("document." + typeNames[file.type]);
    uploadedPath = context.workspaceId + "/" + (weddingId || "workspace") + "/" + randomUUID() + "-" + safeName;
    const upload = await context.supabase.storage.from("wedos-documents").upload(uploadedPath, file, { contentType: file.type, upsert: false });
    if (upload.error) throw upload.error;
    const { data, error } = await context.supabase.from("documents").insert({
      workspace_id: context.workspaceId, wedding_id: weddingId, title, document_type: documentType,
      storage_path: uploadedPath, uploaded_by: context.userId,
    }).select("id,wedding_id,title,document_type,storage_path,uploaded_by,created_at").single();
    if (error) {
      await context.supabase.storage.from("wedos-documents").remove([uploadedPath]);
      throw error;
    }
    return NextResponse.json({ document: data }, { status: 201 });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to upload document" }, { status: 500 });
  }
}
