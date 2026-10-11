"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDownToLine, ArrowRight, Bell, CalendarDays, Check, CheckCheck,
  ChevronDown, CircleDollarSign, ClipboardCheck, Command, FileText, Heart,
  LayoutDashboard, Menu, Plus, Search, Settings2, Users, WalletCards, X,
  Building2, Sparkles, Clock3, MoreHorizontal, PanelLeftClose, TrendingUp,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Task = { id: string; title: string; status: string; priority: string; due_at?: string | null; wedding?: string };
const navGroups = [
  { title: "WORKSPACE", items: [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Weddings", href: "/weddings", icon: Heart },
    { label: "Timeline", href: "/timeline", icon: CalendarDays },
    { label: "Tasks", href: "/tasks", icon: CheckCheck, count: "12" },
    { label: "Guests", href: "/guests", icon: Users },
    { label: "Vendors", href: "/vendors", icon: Building2 },
  ]},
  { title: "MANAGEMENT", items: [
    { label: "Budget & payments", href: "/budget", icon: WalletCards },
    { label: "Design studio", href: "/design", icon: Sparkles },
    { label: "Approvals", href: "/approvals", icon: ClipboardCheck, count: "4" },
    { label: "Documents", href: "/documents", icon: FileText },
    { label: "Reports", href: "/reports", icon: TrendingUp },
  ]},
  { title: "WORKSPACE SETTINGS", items: [
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Team", href: "/team", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings2 },
  ]},
];
const spendData = [
  { month: "May", planned: 28, actual: 19 }, { month: "Jun", planned: 38, actual: 29 },
  { month: "Jul", planned: 46, actual: 35 }, { month: "Aug", planned: 55, actual: 43 },
  { month: "Sep", planned: 70, actual: 52 }, { month: "Oct", planned: 82, actual: 63 },
];
const events = [
  { date: "12", month: "OCT", title: "Venue walkthrough", wedding: "Mehra Wedding", time: "11:30 AM", location: "Taj Falaknuma Palace", status: "Confirmed" },
  { date: "14", month: "OCT", title: "Design presentation", wedding: "Rao Wedding", time: "02:00 PM", location: "Studio meeting", status: "Review" },
  { date: "16", month: "OCT", title: "Vendor alignment", wedding: "Kapoor Wedding", time: "04:30 PM", location: "Video call", status: "In progress" },
];
const vendors = [
  { initials: "FF", name: "Fern & Fable Studio", service: "Florals · Mehra Wedding", amount: "₹2,40,000", status: "Advance due" },
  { initials: "AV", name: "Aura Visuals", service: "Photography · Rao Wedding", amount: "₹1,85,000", status: "60% paid" },
  { initials: "CE", name: "Cedar Experiences", service: "Entertainment · Kapoor Wedding", amount: "₹96,000", status: "Quote received" },
];
function formatDue(date?: string | null) {
  if (!date) return "No due date";
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "No due date" : "Due " + value.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLive, setTasksLive] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks", { cache: "no-store" })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load tasks");
        return payload;
      })
      .then(payload => {
        if (!cancelled) {
          setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
          setTasksLive(true);
        }
      })
      .catch(() => { if (!cancelled) setTasksLive(false); })
      .finally(() => { if (!cancelled) setLoadingTasks(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredTasks = useMemo(() => tasks.filter(task =>
    (task.title + " " + (task.wedding || "")).toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5), [tasks, search]);
  const openTasks = tasks.filter(task => task.status !== "done" && task.status !== "completed");
  const completedTasks = tasks.length - openTasks.length;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }
  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTask.trim()) return;
    setSaving(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask.trim(), priority: "normal" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not create task");
      if (payload.task) setTasks(current => [payload.task, ...current]);
      setNewTask(""); setShowCreate(false); notify("Task created");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not create task");
    } finally { setSaving(false); }
  }
  async function toggleTask(task: Task) {
    const done = task.status !== "done" && task.status !== "completed";
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, done }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update task");
      setTasks(current => current.map(item => item.id === task.id ? { ...item, status: done ? "done" : "todo" } : item));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update task");
    }
  }

  return <div className="min-h-screen bg-neutral-50 text-neutral-900">
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-neutral-200 bg-white transition-transform lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="WedOS home">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-900 text-sm font-bold tracking-tight text-white">w.</span>
          <span className="text-[17px] font-semibold tracking-[-0.8px]">wedos<span className="text-neutral-400">.</span></span>
        </Link>
        <button onClick={() => setMobileNav(false)} className="grid size-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 lg:hidden" aria-label="Close navigation"><X size={17}/></button>
      </div>
      <button onClick={() => notify("Workspace switching will be available when multiple workspaces are connected.")} className="mx-3 mt-4 flex items-center gap-2.5 rounded-lg border border-neutral-200 p-2.5 text-left hover:bg-neutral-50">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-neutral-100 text-xs font-semibold text-neutral-700">AC</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">Atelier Celebrations</span><span className="mt-0.5 block text-[11px] text-neutral-500">Workspace</span></span>
        <ChevronDown size={14} className="text-neutral-400"/>
      </button>
      <nav className="mt-5 flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {navGroups.map(group => <div key={group.title}>
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-[.12em] text-neutral-400">{group.title}</p>
          <div className="space-y-0.5">{group.items.map(item => {
            const Icon = item.icon;
            const active = item.href === "/";
            return <Link key={item.label} href={item.href} onClick={() => setMobileNav(false)} className={`group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors ${active ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}>
              <Icon size={16} strokeWidth={1.8} className={active ? "text-neutral-800" : "text-neutral-400 group-hover:text-neutral-700"}/>
              <span className="flex-1">{item.label}</span>
              {item.count && <span className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500">{item.count}</span>}
            </Link>;
          })}</div>
        </div>)}
      </nav>
      <div className="border-t border-neutral-100 p-3">
        <button onClick={() => window.location.href = "/settings"} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-neutral-50">
          <span className="grid size-8 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700">AS</span>
          <span className="min-w-0 flex-1"><span className="block text-xs font-medium">Atelier Studio</span><span className="block text-[11px] text-neutral-500">Workspace account</span></span>
          <MoreHorizontal size={16} className="text-neutral-400"/>
        </button>
      </div>
    </aside>

    {mobileNav && <button className="fixed inset-0 z-30 bg-black/20 lg:hidden" aria-label="Close menu overlay" onClick={() => setMobileNav(false)}/>}
    <div className="min-h-screen lg:pl-[248px]">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button className="grid size-8 place-items-center rounded-md text-neutral-500 hover:bg-neutral-100 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={18}/></button>
          <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex"><span>Workspace</span><span>/</span><span className="font-medium text-neutral-800">Overview</span></div>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="relative hidden w-48 md:block xl:w-60"><Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="h-8 pl-8 text-xs"/></label>
          <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts" onClick={() => notify("Keyboard shortcuts are coming soon")}><Command size={16}/></Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => notify("You’re all caught up")} className="relative"><Bell size={16}/><span className="absolute right-2 top-2 size-1.5 rounded-full bg-neutral-900"/></Button>
          <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block"/>
          <Link href="/settings" className="grid size-8 place-items-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700">AS</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 pb-12 pt-7 sm:px-6 xl:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.12em] text-neutral-500"><Activity size={13}/> Studio overview</div>
            <h1 className="text-[27px] font-semibold tracking-[-1.2px] sm:text-[32px]">Good afternoon.</h1>
            <p className="mt-1.5 text-sm text-neutral-500">Here’s what’s happening across your weddings.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => notify("Report export is not connected yet")}><ArrowDownToLine size={15}/> Export</Button>
            <Button onClick={() => setShowCreate(true)}><Plus size={16}/> New task</Button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-neutral-100"><CalendarDays size={17} className="text-neutral-600"/></span><div><p className="text-sm font-medium">Your studio at a glance</p><p className="mt-0.5 text-xs text-neutral-500">Keep every celebration moving, one decision at a time.</p></div></div>
          <div className="flex items-center gap-2 text-xs text-neutral-500"><span className={`size-2 rounded-full ${tasksLive ? "bg-emerald-500" : "bg-neutral-300"}`}/>{loadingTasks ? "Syncing workspace…" : tasksLive ? "Tasks synced" : "Workspace preview"}<span className="hidden text-neutral-300 sm:inline">·</span><span className="hidden sm:inline">October 2026</span></div>
        </div>

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active weddings", value: "08", note: "Across your workspace", icon: Heart },
            { label: "Budget managed", value: "₹1.84 Cr", note: "Planned across weddings", icon: CircleDollarSign },
            { label: "Pending approvals", value: "12", note: "4 need attention today", icon: ClipboardCheck },
            { label: "Open tasks", value: loadingTasks ? "—" : String(openTasks.length), note: loadingTasks ? "Loading task data" : `${completedTasks} completed`, icon: CheckCheck },
          ].map((metric, index) => { const Icon = metric.icon; return <Card key={metric.label} className="rounded-xl"><CardContent className="p-4">
            <div className="flex items-center justify-between"><p className="text-xs font-medium text-neutral-500">{metric.label}</p><span className="grid size-8 place-items-center rounded-lg bg-neutral-100 text-neutral-600"><Icon size={16}/></span></div>
            <p className="mt-4 text-[27px] font-semibold tracking-[-1.2px] tabular-nums">{metric.value}</p>
            <p className="mt-1 text-[11px] text-neutral-500">{metric.note}</p>
          </CardContent></Card>; })}
        </section>

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
          <Card>
            <CardHeader><div><CardTitle>Budget overview</CardTitle><CardDescription>Planned versus actual spend · all active celebrations</CardDescription></div><Button variant="outline" size="sm" onClick={() => window.location.href = "/budget"}>View budget <ArrowRight size={14}/></Button></CardHeader>
            <CardContent>
              <div className="mb-3 flex flex-wrap items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight">₹1,24,80,000</span><span className="text-xs text-neutral-500">of ₹1,84,00,000 planned</span></div>
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={spendData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                  <defs><linearGradient id="actualSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#525252" stopOpacity={0.16}/><stop offset="95%" stopColor="#525252" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 4" vertical={false}/>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 11 }} dy={10}/>
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#a3a3a3", fontSize: 10 }} tickFormatter={value => value + "L"}/>
                  <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e5e5e5", fontSize: 12, boxShadow: "0 4px 16px #0000000a" }}/>
                  <Area type="monotone" dataKey="planned" name="Planned" stroke="#d4d4d4" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent"/>
                  <Area type="monotone" dataKey="actual" name="Actual spend" stroke="#404040" strokeWidth={2} fill="url(#actualSpend)" activeDot={{ r: 4, fill: "#404040" }}/>
                </AreaChart></ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-4 text-[11px] text-neutral-500"><span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-neutral-700"/>Actual spend</span><span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t border-dashed border-neutral-300"/>Planned spend</span><span className="ml-auto">May – Oct</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Upcoming schedule</CardTitle><CardDescription>Important moments for your team</CardDescription></div><Button variant="ghost" size="sm" onClick={() => window.location.href = "/timeline"}>Full timeline <ArrowRight size={14}/></Button></CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-neutral-100">
                {events.map(event => <div key={event.date} className="flex gap-3 py-4 first:pt-1 last:pb-1">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50"><span className="text-lg font-semibold leading-5">{event.date}</span><span className="mt-0.5 text-[9px] font-semibold tracking-wider text-neutral-500">{event.month}</span></div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-medium">{event.title}</p><Badge variant={event.status === "Confirmed" ? "success" : event.status === "Review" ? "warning" : "outline"}>{event.status}</Badge></div><p className="mt-1 text-[11px] text-neutral-500">{event.wedding}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400"><Clock3 size={12}/>{event.time} · {event.location}</p></div>
                </div>)}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><div><CardTitle>Priority tasks</CardTitle><CardDescription>{loadingTasks ? "Loading your workspace tasks" : `${openTasks.length} open tasks in your workspace`}</CardDescription></div><Button variant="outline" size="sm" onClick={() => window.location.href = "/tasks"}>View all <ArrowRight size={14}/></Button></CardHeader>
            <CardContent className="pt-0">
              {loadingTasks ? <div className="space-y-3 py-4">{[1,2,3].map(n => <div key={n} className="h-12 animate-pulse rounded-lg bg-neutral-100"/>)}</div> : filteredTasks.length === 0 ? <div className="flex flex-col items-center py-9 text-center"><span className="grid size-10 place-items-center rounded-full bg-neutral-100"><Check size={18}/></span><p className="mt-3 text-sm font-medium">{search ? "No matching tasks" : "You’re all caught up"}</p><p className="mt-1 text-xs text-neutral-500">{search ? "Try a different search." : "Create a task when the next action comes up."}</p></div> :
                <div className="divide-y divide-neutral-100">{filteredTasks.map(task => <div key={task.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <button onClick={() => void toggleTask(task)} aria-label={task.status === "done" ? "Reopen task" : "Complete task"} className={`grid size-[18px] shrink-0 place-items-center rounded border transition-colors ${task.status === "done" || task.status === "completed" ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:border-neutral-500"}`}>{(task.status === "done" || task.status === "completed") && <Check size={12}/>}</button>
                  <div className="min-w-0 flex-1"><p className={`truncate text-xs font-medium ${task.status === "done" ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{task.title}</p><p className="mt-1 text-[11px] text-neutral-500">{task.wedding || "Workspace task"} · {formatDue(task.due_at)}</p></div>
                  <Badge variant={task.priority === "urgent" || task.priority === "high" ? "warning" : "outline"}>{task.priority || "Normal"}</Badge>
                </div>)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><div><CardTitle>Vendor commitments</CardTitle><CardDescription>Latest activity across your celebrations</CardDescription></div><Button variant="outline" size="sm" onClick={() => window.location.href = "/vendors"}>Directory <ArrowRight size={14}/></Button></CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-neutral-100">{vendors.map(vendor => <div key={vendor.name} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-neutral-200 bg-neutral-50 text-[10px] font-semibold text-neutral-600">{vendor.initials}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{vendor.name}</p><p className="mt-1 truncate text-[11px] text-neutral-500">{vendor.service}</p></div>
                <div className="text-right"><p className="text-xs font-medium tabular-nums">{vendor.amount}</p><p className="mt-1 text-[11px] text-neutral-500">{vendor.status}</p></div>
              </div>)}</div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>

    {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/30 p-4 backdrop-blur-[2px]" onMouseDown={event => { if (event.target === event.currentTarget) setShowCreate(false); }}>
      <form onSubmit={createTask} className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-medium text-neutral-500">WORKSPACE</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Create a task</h2><p className="mt-1 text-xs text-neutral-500">Add a follow-up to your team’s work queue.</p></div><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setShowCreate(false)}><X size={16}/></Button></div>
        <label className="mb-2 block text-xs font-medium" htmlFor="task-title">Task name</label><Input id="task-title" autoFocus maxLength={180} required value={newTask} onChange={event => setNewTask(event.target.value)} placeholder="e.g. Confirm ceremony layout"/>
        <div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={saving || !newTask.trim()}>{saving ? "Saving…" : <><Plus size={15}/> Create task</>}</Button></div>
      </form>
    </div>}
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-xs font-medium text-white shadow-xl"><Check size={15}/>{toast}</div>}
  </div>;
}
