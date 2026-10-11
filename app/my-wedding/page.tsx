"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Heart, MapPin, Plus, Users, Wallet, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Wedding = { id:string; title:string; couple_names:string|null; status:string; start_date:string|null; venue_city:string|null; guest_count:number|null; budget:number|null; currency:string|null };
export default function MyWeddingPage() {
  const [wedding,setWedding]=useState<Wedding|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    let cancelled=false;
    fetch("/api/weddings",{cache:"no-store"}).then(async response=>{const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to load your wedding");return payload;})
      .then(payload=>{if(!cancelled)setWedding(((payload.weddings||[])[0] as Wedding|undefined)||null);})
      .catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:"Unable to load your wedding");})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[]);
  const date=wedding?.start_date?new Date(wedding.start_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"Date not set";
  const money=(value:number|null|undefined)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value||0);
  const countdown=wedding?.start_date?Math.max(0,Math.ceil((new Date(wedding.start_date+"T00:00:00").getTime()-new Date(new Date().toDateString()).getTime())/86400000)):null;
  const modules=[
    {icon:CalendarDays,title:"Ceremonies & timeline",desc:"Organise each function and its schedule",href:"/timeline"},
    {icon:ClipboardList,title:"Planning checklist",desc:"Keep decisions and next steps together",href:"/tasks"},
    {icon:Users,title:"Guest list & RSVP",desc:"Build your list and track responses",href:"/guests"},
    {icon:Wallet,title:"Budget & payments",desc:"Track estimates and payment milestones",href:"/budget"},
  ];
  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-8"><Link href="/my-wedding" className="flex items-center gap-2.5 text-base font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-sm text-white">w.</span> wedos<span className="text-neutral-400">.</span></Link><div className="flex items-center gap-3"><Badge variant="outline"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-500"/>Private workspace</Badge><Link href="/settings" aria-label="Settings" className="grid size-8 place-items-center rounded-full bg-neutral-200 text-neutral-600"><Settings2 size={15}/></Link></div></header>
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Your wedding workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-[-1.2px]">{loading?"Loading your wedding…":wedding?.couple_names||"Your wedding"}</h1><p className="mt-2 text-sm text-neutral-500">One shared place to plan together and keep every detail on track.</p></div><Button variant="outline" onClick={()=>window.location.assign("/my-wedding/details")}><Plus size={15}/> Wedding details</Button></div>
      {error&&<div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading&&<div className="h-56 animate-pulse rounded-2xl border border-neutral-200 bg-white"/>}
      {!loading&&!wedding&&!error&&<Card><CardContent className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center"><span className="grid size-12 place-items-center rounded-xl bg-neutral-100"><Heart size={21}/></span><h2 className="mt-4 text-base font-semibold">Your wedding space is ready</h2><p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">Add your wedding details to start planning ceremonies, guests and your budget.</p><Button className="mt-5" onClick={()=>window.location.assign("/my-wedding/details")}>Set up wedding details <ChevronRight size={15}/></Button></CardContent></Card>}
      {wedding&&<><section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8"><div className="absolute -right-14 -top-28 size-72 rounded-full border border-neutral-200"/><div className="absolute -right-2 -top-16 size-48 rounded-full border border-neutral-200"/><div className="relative flex flex-wrap items-end justify-between gap-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">The day you’re planning for</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{wedding.couple_names||wedding.title}</h2><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500"><span className="flex items-center gap-2"><CalendarDays size={14}/>{date}</span>{wedding.venue_city&&<span className="flex items-center gap-2"><MapPin size={14}/>{wedding.venue_city}</span>}</div></div><div className="relative min-w-[135px] rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">Countdown</p><p className="mt-1 text-4xl font-semibold tracking-[-1.5px] tabular-nums">{countdown===null?"—":countdown}</p><p className="mt-1 text-[11px] text-neutral-500">{countdown===null?"Add your date":"days to go"}</p></div></div></section>
      <section className="my-4 grid gap-3 sm:grid-cols-3">{[{label:"Estimated budget",value:money(wedding.budget),note:"Track spending",icon:CircleDollarSign},{label:"Guest count",value:wedding.guest_count??"—",note:"Keep your list organised",icon:Users},{label:"Wedding location",value:wedding.venue_city||"Not set",note:"Venue details can be added later",icon:MapPin}].map(item=>{const Icon=item.icon;return <Card key={item.label}><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-neutral-500"><Icon size={15}/>{item.label}</div><p className="mt-4 truncate text-xl font-semibold tracking-tight">{item.value}</p><p className="mt-1 text-[11px] text-neutral-500">{item.note}</p></CardContent></Card>})}</section>
      <div className="mb-4 mt-8"><h2 className="text-base font-semibold tracking-tight">Your planning workspace</h2><p className="mt-1 text-xs text-neutral-500">Start with the areas that matter most to you.</p></div>
      <section className="grid gap-3 sm:grid-cols-2">{modules.map(({icon:Icon,title,desc,href})=><Link href={href} key={title} className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-sm"><span className="grid size-9 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600"><Icon size={17}/></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-neutral-500">{desc}</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-neutral-700">Open section <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5"/></span></Link>)}</section></>}
      <footer className="mt-10 border-t border-neutral-200 pt-4 text-[11px] text-neutral-400">WedOS · Your wedding, thoughtfully organised.</footer>
    </div>
  </main>;
}
