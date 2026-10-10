import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  return NextResponse.json({ service: "wedos-web", status: "ok", backend: configured ? "configured" : "not_configured" });
}
