"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Heart, MapPin, Plus, Users, Wallet } from "lucide-react";

type Wedding = { id:string; title:string; couple_names:string|null; status:string; start_date:string|null; venue_city:string|null; guest_count:number|null; budget:number|null; currency:string|null };
export default function MyWeddingPage() {
  const [wedding,setWedding]=useState<Wedding|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    let cancelled=false;
    fetch("/api/weddings",{cache:"no-store"}).then(async response=>{
      const payload=await response.json();
      if(!response.ok) throw new Error(payload.error||"Unable to load your wedding");
      return payload;
    }).then(payload=>{
      if(cancelled)return;
      const first=(payload.weddings||[])[0] as Wedding|undefined;
      setWedding(first||null);
    }).catch(cause=>{if(!cancelled)setError(cause instanceof Error?cause.message:"Unable to load your wedding");})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[]);
  const date=wedding?.start_date?new Date(wedding.start_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"Date not set";
  const money=(value:number|null|undefined)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value||0);
  const modules=[
    {icon:CalendarDays,title:"Ceremonies & timeline",desc:"Organise every function and its schedule",href:"/timeline"},
    {icon:ClipboardList,title:"Planning checklist",desc:"Keep decisions and next steps in one place",href:"/tasks"},
    {icon:Users,title:"Guest list",desc:"Build your guest list and track responses",href:"/guests"},
    {icon:Wallet,title:"Budget & payments",desc:"Track estimates, commitments and payments",href:"/budget"},
  ];
  return <main className="couple-app">
    <aside className="couple-sidebar">
      <Link className="couple-brand" href="/my-wedding"><span className="couple-brand-mark">w.</span> wedos</Link>
      <div className="couple-sidebar-label">YOUR WEDDING</div>
      <Link className="couple-nav active" href="/my-wedding"><Heart size={17}/> Overview</Link>
      <Link className="couple-nav" href="/timeline"><CalendarDays size={17}/> Ceremonies & timeline</Link>
      <Link className="couple-nav" href="/tasks"><ClipboardList size={17}/> Checklist</Link>
      <Link className="couple-nav" href="/budget"><CircleDollarSign size={17}/> Budget</Link>
      <Link className="couple-nav" href="/guests"><Users size={17}/> Guests & RSVP</Link>
      <div className="couple-sidebar-bottom"><div className="couple-private"><CheckCircle2 size={16}/><span>Your wedding space is private to invited members.</span></div></div>
    </aside>
    <section className="couple-main">
      <header className="couple-topbar"><span className="couple-breadcrumb">WedOS <ChevronRight size={14}/> My wedding</span><Link className="couple-avatar" href="/settings" aria-label="Settings">W</Link></header>
      <div className="couple-page-head"><div><div className="setup-kicker">YOUR WEDDING WORKSPACE</div><h1>{loading?"Loading your wedding…":wedding?.couple_names||"Your wedding"}</h1><p>One shared place to plan together, make decisions and keep every detail on track.</p></div><button className="couple-outline-button" onClick={()=>window.location.assign("/my-wedding/details")}><Plus size={16}/> Wedding details</button></div>
      {error&&<div className="setup-error" role="alert">{error}</div>}
      {!loading&&!wedding&&!error&&<section className="couple-empty"><div className="couple-empty-icon"><Heart size={22}/></div><h2>Your wedding space is ready</h2><p>We couldn&apos;t find a wedding record yet. Add your wedding details to start planning.</p><Link className="couple-primary-button" href="/weddings">Set up wedding details <ChevronRight size={16}/></Link></section>}
      {wedding&&<><section className="couple-hero">
        <div className="couple-hero-copy"><div className="couple-hero-label">THE DAY YOU&apos;RE PLANNING FOR</div><h2>{wedding.couple_names||wedding.title}</h2><div className="couple-hero-meta"><span><CalendarDays size={15}/>{date}</span>{wedding.venue_city&&<span><MapPin size={15}/>{wedding.venue_city}</span>}</div></div>
        <div className="couple-countdown"><span>WEDDING DATE</span><strong>{wedding.start_date?Math.max(0,Math.ceil((new Date(wedding.start_date+"T00:00:00").getTime()-new Date(new Date().toDateString()).getTime())/86400000)):"—"}</strong><small>{wedding.start_date?"days to go":"Add your date"}</small></div>
      </section>
      <section className="couple-stats">
        <div className="couple-stat"><span>Estimated budget</span><strong>{money(wedding.budget)}</strong><small>Set and track your spending</small></div>
        <div className="couple-stat"><span>Guest count</span><strong>{wedding.guest_count??"—"}</strong><small>Keep your guest list organised</small></div>
        <div className="couple-stat"><span>Wedding location</span><strong className="couple-stat-location">{wedding.venue_city||"Not set"}</strong><small>Venue details can be added later</small></div>
      </section>
      <div className="couple-section-heading"><div><h2>Your planning workspace</h2><p>Start with the areas that matter most to you.</p></div></div>
      <section className="couple-module-grid">{modules.map(({icon:Icon,title,desc,href})=><Link className="couple-module" href={href} key={title}><span className="couple-module-icon"><Icon size={19}/></span><span className="couple-module-title">{title}</span><span className="couple-module-desc">{desc}</span><span className="couple-module-link">Open section <ChevronRight size={15}/></span></Link>)}</section>
      </>}
      <footer className="couple-footer">WedOS · Your wedding, thoughtfully organised.</footer>
    </section>
  </main>;
}
