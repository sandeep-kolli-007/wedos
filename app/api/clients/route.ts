import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
async function context(){
 const supabase=await createSupabaseServerClient();
 const {data:claims,error:authError}=await supabase.auth.getClaims();
 const userId=claims?.claims?.sub;
 if(authError||!userId)return {response:NextResponse.json({error:"Sign in required"},{status:401})};
 const {data:membership,error}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",userId).limit(1).maybeSingle();
 if(error)throw error;
 if(!membership)return {response:NextResponse.json({error:"Create a workspace before managing clients"},{status:409})};
 return {supabase,userId,workspaceId:membership.workspace_id};
}
export async function GET(){
 try{const c=await context();if("response"in c)return c.response;
 const {data,error}=await c.supabase.from("clients").select("id,display_name,email,phone,notes,created_at").eq("workspace_id",c.workspaceId).order("display_name");
 if(error)throw error;return NextResponse.json({clients:data??[]});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to load clients"},{status:500})}
}
export async function POST(request:Request){
 try{const c=await context();if("response"in c)return c.response;const body=await request.json() as Record<string,unknown>;
 if(typeof body.display_name!=="string"||body.display_name.trim().length<2)return NextResponse.json({error:"Enter a client name"},{status:400});
 const clean=(v:unknown,max:number)=>typeof v==="string"&&v.trim()?v.trim().slice(0,max):null;
 const {data,error}=await c.supabase.from("clients").insert({workspace_id:c.workspaceId,display_name:body.display_name.trim().slice(0,160),email:clean(body.email,254),phone:clean(body.phone,40),notes:clean(body.notes,2000)}).select("id,display_name,email,phone,notes,created_at").single();
 if(error)throw error;return NextResponse.json({client:data},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to create client"},{status:500})}
}
