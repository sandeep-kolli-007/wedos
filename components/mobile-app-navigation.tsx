"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCheck, ChevronUp, CircleDollarSign, ClipboardCheck, FileText, Heart, Home, LayoutGrid, Plus, Settings2, Sparkles, Users, Building2, X, TrendingUp, ArrowUpRight } from "lucide-react";

const primary = [
  { label: "Home", href: "/", icon: Home },
  { label: "Weddings", href: "/weddings", icon: Heart },
  { label: "Timeline", href: "/timeline", icon: CalendarDays },
  { label: "Tasks", href: "/tasks", icon: CheckCheck },
];
const more = [
  { label: "Guests", href: "/guests", icon: Users },
  { label: "Vendors", href: "/vendors", icon: Building2 },
  { label: "Budget & payments", href: "/budget", icon: CircleDollarSign },
  { label: "Design studio", href: "/design", icon: Sparkles },
  { label: "Approvals", href: "/approvals", icon: ClipboardCheck },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Reports", href: "/reports", icon: TrendingUp },
  { label: "Settings", href: "/settings", icon: Settings2 },
];
const quickActions = [
  { label: "New wedding", description: "Set up a celebration workspace", href: "/weddings?create=1", icon: Heart },
  { label: "New task", description: "Capture something to get done", href: "/tasks?create=1", icon: CheckCheck },
  { label: "Add guest", description: "Build your invitation list", href: "/guests", icon: Users },
  { label: "Add vendor", description: "Manage your service partners", href: "/vendors", icon: Building2 },
];

export default function MobileAppNavigation() {
  const pathname = usePathname();
  const [panel, setPanel] = useState<"more" | "add" | null>(null);
  const hidden = pathname === "/login" || pathname.startsWith("/onboarding") || pathname.startsWith("/auth/");
  useEffect(() => { setPanel(null); }, [pathname]);
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);
  if (hidden) return null;
  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const moreActive = more.some(item => active(item.href));
  return <>
    {panel && <>
      <button aria-label="Close action sheet" className="fixed inset-0 z-[80] bg-neutral-950/35 md:hidden" onClick={() => setPanel(null)}/>
      <section role="dialog" aria-modal="true" aria-label={panel === "add" ? "Quick actions" : "All workspace tools"} className="fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[90] max-h-[75dvh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl md:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-sm font-semibold">{panel === "add" ? "Create something" : "All workspace tools"}</p><p className="mt-0.5 text-[11px] text-neutral-500">{panel === "add" ? "Quickly move your celebration forward" : "Everything for your celebrations"}</p></div>
          <button onClick={() => setPanel(null)} className="grid size-8 place-items-center rounded-lg hover:bg-neutral-100" aria-label="Close menu"><X size={16}/></button>
        </div>
        {panel === "add" ? <div className="space-y-2">{quickActions.map(item => { const Icon = item.icon; return <Link key={item.label} href={item.href} onClick={() => setPanel(null)} className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3 transition-colors hover:bg-neutral-50"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-neutral-100"><Icon size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="block text-xs text-neutral-500">{item.description}</span></span><ArrowUpRight size={16} className="text-neutral-400"/></Link>; })}</div> :
          <div className="grid grid-cols-3 gap-2">{more.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setPanel(null)} className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center ${active(item.href) ? "border-neutral-300 bg-neutral-100 text-neutral-900" : "border-neutral-100 text-neutral-600 hover:bg-neutral-50"}`}><Icon size={19} strokeWidth={1.8}/><span className="text-[10px] font-medium leading-4">{item.label}</span></Link>; })}</div>}
      </section>
    </>}
    <nav aria-label="Primary mobile navigation" className="mobile-tabbar fixed inset-x-0 bottom-0 z-[100] border-t border-neutral-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid h-[62px] max-w-lg grid-cols-6 items-stretch px-2">
        {primary.slice(0,2).map(item => { const Icon = item.icon; const selected = active(item.href); return <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 transition-colors ${selected ? "text-neutral-950" : "text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${selected ? "bg-neutral-100" : "bg-transparent"}`}><Icon size={19} strokeWidth={selected ? 2.2 : 1.8}/></span><span className={`text-[10px] ${selected ? "font-semibold" : "font-medium"}`}>{item.label}</span></Link>; })}
        <button type="button" aria-label="Open quick actions" aria-expanded={panel === "add"} onClick={() => setPanel(current => current === "add" ? null : "add")} className="flex flex-col items-center justify-center gap-1"><span className="grid size-10 -translate-y-2 place-items-center rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/15 transition-transform active:scale-95"><Plus size={22}/></span><span className="-mt-2 text-[10px] font-medium text-neutral-500">Add</span></button>
        {primary.slice(2).map(item => { const Icon = item.icon; const selected = active(item.href); return <Link key={item.href} href={item.href} aria-current={selected ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 transition-colors ${selected ? "text-neutral-950" : "text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${selected ? "bg-neutral-100" : "bg-transparent"}`}><Icon size={19} strokeWidth={selected ? 2.2 : 1.8}/></span><span className={`text-[10px] ${selected ? "font-semibold" : "font-medium"}`}>{item.label}</span></Link>; })}
        <button type="button" aria-expanded={panel === "more"} onClick={() => setPanel(current => current === "more" ? null : "more")} className={`flex flex-col items-center justify-center gap-1 ${panel === "more" || moreActive ? "text-neutral-950" : "text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${panel === "more" || moreActive ? "bg-neutral-100" : "bg-transparent"}`}>{panel === "more" ? <ChevronUp size={19}/> : <LayoutGrid size={19} strokeWidth={moreActive ? 2.2 : 1.8}/>}</span><span className={`text-[10px] ${panel === "more" || moreActive ? "font-semibold" : "font-medium"}`}>More</span></button>
      </div>
    </nav>
  </>;
}
