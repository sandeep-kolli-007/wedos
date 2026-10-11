"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, CheckCheck, ChevronUp, CircleDollarSign, ClipboardCheck, FileText, Heart, Home, LayoutGrid, Plus, Settings2, Sparkles, Users, Building2, X, TrendingUp } from "lucide-react";

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

export default function MobileAppNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const hidden = pathname === "/login" || pathname.startsWith("/onboarding") || pathname.startsWith("/auth/");
  if (hidden) return null;

  const active = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  const moreActive = more.some(item => active(item.href));
  return <>
    {moreOpen && <><button aria-label="Close navigation menu" className="fixed inset-0 z-[80] bg-neutral-950/25 md:hidden" onClick={() => setMoreOpen(false)}/><section className="fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[90] rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl md:hidden" aria-label="More sections"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-semibold">All workspace tools</p><p className="mt-0.5 text-[11px] text-neutral-500">Everything for your celebrations</p></div><button onClick={() => setMoreOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-neutral-100" aria-label="Close menu"><X size={16}/></button></div><div className="grid grid-cols-3 gap-2">{more.map(item=>{const Icon=item.icon;return <Link key={item.href} href={item.href} onClick={()=>setMoreOpen(false)} className={`flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center ${active(item.href)?"border-neutral-300 bg-neutral-100 text-neutral-900":"border-neutral-100 text-neutral-600 hover:bg-neutral-50"}`}><Icon size={19} strokeWidth={1.8}/><span className="text-[10px] font-medium leading-4">{item.label}</span></Link>})}</div></section></>}
    <nav aria-label="Primary mobile navigation" className="mobile-tabbar fixed inset-x-0 bottom-0 z-[100] border-t border-neutral-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid h-[62px] max-w-lg grid-cols-5 items-stretch px-2">
        {primary.slice(0,2).map(item=>{const Icon=item.icon;const selected=active(item.href);return <Link key={item.href} href={item.href} aria-current={selected?"page":undefined} className={`flex flex-col items-center justify-center gap-1 transition-colors ${selected?"text-neutral-950":"text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${selected?"bg-neutral-100":"bg-transparent"}`}><Icon size={19} strokeWidth={selected?2.2:1.8}/></span><span className={`text-[10px] ${selected?"font-semibold":"font-medium"}`}>{item.label}</span></Link>})}
        <Link href="/weddings" aria-label="Create or manage a wedding" className="flex flex-col items-center justify-center gap-1"><span className="grid size-10 -translate-y-2 place-items-center rounded-2xl bg-neutral-900 text-white shadow-lg shadow-neutral-900/15 transition-transform active:scale-95"><Plus size={22}/></span><span className="-mt-2 text-[10px] font-medium text-neutral-500">Add</span></Link>
        {primary.slice(2).map(item=>{const Icon=item.icon;const selected=active(item.href);return <Link key={item.href} href={item.href} aria-current={selected?"page":undefined} className={`flex flex-col items-center justify-center gap-1 transition-colors ${selected?"text-neutral-950":"text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${selected?"bg-neutral-100":"bg-transparent"}`}><Icon size={19} strokeWidth={selected?2.2:1.8}/></span><span className={`text-[10px] ${selected?"font-semibold":"font-medium"}`}>{item.label}</span></Link>})}
        <button aria-expanded={moreOpen} onClick={()=>setMoreOpen(value=>!value)} className={`flex flex-col items-center justify-center gap-1 ${moreOpen||moreActive?"text-neutral-950":"text-neutral-400"}`}><span className={`grid size-7 place-items-center rounded-lg ${moreOpen||moreActive?"bg-neutral-100":"bg-transparent"}`}>{moreOpen?<ChevronUp size={19}/>:<LayoutGrid size={19} strokeWidth={moreActive?2.2:1.8}/>}</span><span className={`text-[10px] ${moreOpen||moreActive?"font-semibold":"font-medium"}`}>More</span></button>
      </div>
    </nav>
  </>;
}
