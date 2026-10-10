"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardCheck, Clock3, Compass, FileText, Heart, LayoutDashboard, Menu, MessageCircle, Plus, Search, Settings2, Sparkles, Users, WalletCards, X } from "lucide-react";

type Task = { id: number | string; title: string; meta: string; priority: "High" | "Normal" | "Low" | "Urgent"; done: boolean };
const initialTasks: Task[] = [
  { id: 1, title: "Approve floral moodboard", meta: "Mehra Wedding · Design", priority: "High", done: false },
  { id: 2, title: "Confirm artist call time", meta: "Rao Wedding · Production", priority: "High", done: false },
  { id: 3, title: "Send revised catering estimate", meta: "Kapoor Wedding · Finance", priority: "Normal", done: false },
  { id: 4, title: "Review venue floor plan", meta: "Mehra Wedding · Planning", priority: "Low", done: true },
];
const events = [
  { day: "12", month: "OCT", title: "Mehra Wedding · Venue walkthrough", meta: "11:30 AM · Taj Falaknuma Palace", status: "Confirmed" },
  { day: "14", month: "OCT", title: "Rao Wedding · Design presentation", meta: "02:00 PM · Studio meeting", status: "Needs review" },
  { day: "16", month: "OCT", title: "Kapoor Wedding · Vendor alignment", meta: "04:30 PM · Video call", status: "In progress" },
];
const vendors = [
  { initials: "FL", name: "Fern & Fable Studio", type: "Florals · Mehra Wedding", amount: "₹2,40,000", status: "Advance due", bg: "#e5eee5", color: "#47724d" },
  { initials: "AV", name: "Aura Visuals", type: "Photography · Rao Wedding", amount: "₹1,85,000", status: "Paid 60%", bg: "#f5e8df", color: "#a16c4d" },
  { initials: "CE", name: "Cedar Experiences", type: "Entertainment · Kapoor Wedding", amount: "₹96,000", status: "Quote received", bg: "#ebe7f5", color: "#7566a2" },
];
const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Weddings", icon: Heart, count: "8" },
  { label: "Timeline", icon: CalendarDays },
  { label: "Tasks & approvals", icon: ClipboardCheck, count: "12" },
  { label: "Vendors", icon: Users },
  { label: "Budget & payments", icon: WalletCards },
  { label: "Design studio", icon: Sparkles },
  { label: "Documents", icon: FileText },
];
const money = (n: number) => "₹" + n.toLocaleString("en-IN");
function BudgetChart() {
  const points = "0,114 37,97 74,104 111,74 148,82 185,58 222,68 259,42 296,53 333,27 370,35 407,12";
  return <svg viewBox="0 0 420 145" preserveAspectRatio="none" className="chart" role="img" aria-label="Budget spend trend chart">
    {[25,55,85,115].map(y => <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="#eff0ec" strokeDasharray="3 5" />)}
    <defs><linearGradient id="budgetFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#527d67" stopOpacity=".22"/><stop offset="100%" stopColor="#527d67" stopOpacity="0"/></linearGradient></defs>
    <polygon points={`0,135 ${points} 420,135`} fill="url(#budgetFill)" />
    <polyline points={points} fill="none" stroke="#46755b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    <polyline points="0,128 37,116 74,119 111,108 148,110 185,93 222,91 259,82 296,76 333,65 370,63 407,51" fill="none" stroke="#d7a477" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"/>
    {[{x:0,t:"JUL"},{x:105,t:"AUG"},{x:210,t:"SEP"},{x:315,t:"OCT"},{x:407,t:"NOV"}].map(p=><text key={p.t} x={p.x} y="144" fill="#a0a59e" fontSize="9" textAnchor={p.x===0?"start":p.x===407?"end":"middle"}>{p.t}</text>)}
  </svg>;
}
export default function Home() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeNav, setActiveNav] = useState("Overview");
  const [period, setPeriod] = useState("Last 6 months");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [liveTasks, setLiveTasks] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/tasks", { cache: "no-store" }).then(async response => response.ok ? response.json() : null).then(payload => {
      if (cancelled || !payload || !Array.isArray(payload.tasks)) return;
      const mapped = payload.tasks.map((task: { id: string; title: string; status: string; priority: string; due_at?: string | null }) => ({
        id: task.id, title: task.title,
        meta: task.due_at ? "Due " + new Date(task.due_at).toLocaleDateString("en-IN") : "Workspace · Planning",
        priority: (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) as Task["priority"],
        done: task.status === "done",
      }));
      setTasks(mapped); setLiveTasks(true);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  const doneCount = useMemo(() => tasks.filter(t => t.done).length, [tasks]);
  const filteredTasks = tasks.filter(t => (t.title + t.meta).toLowerCase().includes(query.toLowerCase()));
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2600); }
  async function addTask() {
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    try {
      const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, priority: "normal" }) });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409) { notify(payload.error || "Create a workspace before adding tasks"); return; }
      if (response.ok && payload.task) {
        const task = payload.task;
        setTasks(prev => [{ id: task.id, title: task.title, meta: task.due_at ? "Due " + new Date(task.due_at).toLocaleDateString("en-IN") : "Workspace · Planning", priority: "Normal", done: task.status === "done" }, ...prev]);
        setLiveTasks(true); setNewTitle(""); setShowNew(false); notify("Task saved to your workspace"); return;
      }
    } catch { /* Keep dashboard preview usable without a backend connection. */ }
    setTasks(prev => [{ id: Date.now(), title, meta: "Demo · Planning", priority: "Normal", done: false }, ...prev]);
    setNewTitle(""); setShowNew(false); notify("Task added to dashboard preview");
  }
  async function toggleTask(task: Task) {
    const nextDone = !task.done;
    setTasks(prev => prev.map(item => item.id === task.id ? { ...item, done: nextDone } : item));
    if (typeof task.id !== "string") return;
    try {
      const response = await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: task.id, done: nextDone }) });
      if (!response.ok) notify("Could not sync task change; refresh and try again");
    } catch { notify("Task change is local only while offline"); }
  }
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">w.</div><div className="brand-name">wed<span>os</span></div></div>
      <button className="workspace" onClick={() => notify("Workspace switcher is ready for multi-team setup")}><div className="workspace-icon">A</div><div><small>WORKSPACE</small><strong>Atelier Celebrations</strong></div><ChevronDown size={14} style={{marginLeft:"auto",color:"#858a84"}}/></button>
      <div><div className="side-label">WORKSPACE</div><nav className="nav-group">{nav.map(item=>{const Icon=item.icon;return <button key={item.label} className={`nav-item ${activeNav===item.label?"active":""}`} onClick={()=>{setActiveNav(item.label);if(item.label!=="Overview")notify(item.label+" view selected");}}><Icon/><span>{item.label}</span>{item.count&&<span className="nav-count">{item.count}</span>}</button>})}</nav></div>
      <div><div className="side-label">YOUR SPACE</div><nav className="nav-group"><button className="nav-item" onClick={()=>notify("Circle messaging is coming next")}><MessageCircle/><span>Team conversations</span></button><button className="nav-item" onClick={()=>notify("Settings will be available with workspace setup")}><Settings2/><span>Settings</span></button></nav></div>
      <div className="side-bottom"><div className="planner-card"><div className="planner-row"><div className="planner-avatar">AS</div><div><strong>Atelier Studio</strong><small>Professional plan</small></div></div><p>Your next celebration is 2 weeks away. Keep every detail in motion.</p><button className="plan-link" onClick={()=>notify("Workspace plan details")}>Manage workspace <ArrowRight size={12} style={{display:"inline",verticalAlign:"middle"}}/></button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span style={{padding:"0 8px",color:"#c5c8c2"}}>/</span><b>{activeNav}</b></div><div className="top-actions"><label className="searchbox"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..." aria-label="Search tasks"/></label><button className="icon-btn" aria-label="Notifications" onClick={()=>notify("You're all caught up on notifications")}><Bell/><span className="notification-dot"/></button><button className="icon-btn" aria-label="Help" onClick={()=>notify("WedOS help centre coming soon")}><Compass/></button><a className="user-mini" title="Sign in to WedOS" href="/login">AS</a></div></header>
      <section className="page-head"><div><div className="eyebrow">MONDAY, 10 OCTOBER 2026</div><h1>Your celebrations, in motion.</h1><p>A clear view of the work behind every unforgettable moment.</p></div><div className="head-actions"><button className="btn" onClick={()=>notify("Export report is being prepared")}><ArrowDownRight/> Export report</button><button className="btn primary" onClick={()=>setShowNew(true)}><Plus/> New task</button></div></section>
      <section className="welcome-strip"><div className="welcome-copy"><div className="eyebrow">YOUR STUDIO AT A GLANCE</div><h2>Good afternoon, Atelier team.</h2><p>Three celebrations are moving this week. Here’s what needs your eye.</p></div><div className="welcome-date"><strong>October 2026</strong>{liveTasks ? "Live workspace tasks" : "Preview data · Connect Supabase to sync"}</div></section>
      <section className="metric-grid">
        <div className="metric-card"><div className="metric-top"><span className="metric-label">Active weddings</span><span className="metric-icon tone-green"><Heart/></span></div><div className="metric-value">08</div><div className="metric-foot"><span className="trend"><ArrowUpRight size={12} style={{display:"inline",verticalAlign:"middle"}}/> 2 new</span> <span>this month</span></div></div>
        <div className="metric-card"><div className="metric-top"><span className="metric-label">Budget under management</span><span className="metric-icon tone-orange"><CircleDollarSign/></span></div><div className="metric-value">₹1.84 Cr</div><div className="metric-foot"><span className="trend">68%</span><span>committed across weddings</span></div></div>
        <div className="metric-card"><div className="metric-top"><span className="metric-label">Pending approvals</span><span className="metric-icon tone-lav"><ClipboardCheck/></span></div><div className="metric-value">12</div><div className="metric-foot"><span style={{color:"#b26e4f",fontWeight:700}}>4 due today</span><span>· across 3 weddings</span></div></div>
        <div className="metric-card"><div className="metric-top"><span className="metric-label">Tasks completed</span><span className="metric-icon tone-pink"><Check/></span></div><div className="metric-value">{doneCount+31}<span style={{fontSize:14,color:"#929790"}}> / 48</span></div><div className="metric-foot"><span className="trend">{Math.round((doneCount+31)/48*100)}%</span><span>of planned work complete</span></div></div>
      </section>
      <section className="content-grid">
        <article className="panel"><div className="panel-head"><div><h3 className="panel-title">Budget overview</h3><div className="panel-sub">Committed spend across all active celebrations</div></div><select className="select-lite" value={period} onChange={e=>setPeriod(e.target.value)} aria-label="Chart period"><option>Last 6 months</option><option>Last 3 months</option><option>This year</option></select></div><div className="budget-total"><strong>₹1,24,80,000</strong><span>of ₹1,84,00,000 planned</span></div><div className="chart-wrap"><BudgetChart/></div><div className="chart-legend"><span><i className="legend-dot" style={{background:"#46755b"}}/>Actual spend</span><span><i className="legend-dot" style={{background:"#d7a477"}}/>Planned spend</span><span style={{marginLeft:"auto"}}>{period}</span></div></article>
        <article className="panel"><div className="panel-head"><div><h3 className="panel-title">Coming up</h3><div className="panel-sub">Your team's next key moments</div></div><button className="section-link" onClick={()=>{setActiveNav("Timeline");notify("Opening the full timeline")}}>Full timeline <ArrowRight/></button></div><div className="event-list">{events.map(e=><div className="event-row" key={e.day}><div className="event-date"><b>{e.day}</b><span>{e.month}</span></div><div className="event-info"><strong>{e.title}</strong><span>{e.meta}</span></div><span className={`event-status ${e.status==="Needs review"?"review":e.status==="In progress"?"draft":""}`}>{e.status}</span></div>)}</div></article>
      </section>
      <section className="lower-grid">
        <article className="panel"><div className="panel-head"><div><h3 className="panel-title">Priority tasks</h3><div className="panel-sub">{tasks.filter(t=>!t.done).length} items still need attention · Sorted by priority</div></div><button className="section-link" onClick={()=>notify("Showing all tasks")}>View all <ArrowRight/></button></div><div className="task-list">{filteredTasks.map(t=><label className="task-row" key={t.id}><input className="task-check" type="checkbox" checked={t.done} onChange={()=>void toggleTask(t)}/><span className={`task-text ${t.done?"done":""}`}><strong>{t.title}</strong><small>{t.meta}</small></span><span className={`task-priority ${t.priority==="Low"?"low":""}`}>{t.priority}</span></label>)}{filteredTasks.length===0&&<p style={{fontSize:12,color:"#888",padding:"20px 0"}}>No matching tasks found.</p>}</div></article>
        <article className="panel"><div className="panel-head"><div><h3 className="panel-title">Vendor pulse</h3><div className="panel-sub">Recent activity across your celebrations</div></div><button className="section-link" onClick={()=>{setActiveNav("Vendors");notify("Opening vendor directory")}}>Directory <ArrowRight/></button></div><div className="vendor-list">{vendors.map(v=><div className="vendor-row" key={v.name}><div className="vendor-avatar" style={{background:v.bg,color:v.color}}>{v.initials}</div><div className="vendor-meta"><strong>{v.name}</strong><small>{v.type}</small></div><div className="vendor-amount">{v.amount}<small>{v.status}</small></div></div>)}</div></article>
      </section>
      <nav className="mobile-menu">{[{label:"Home",icon:LayoutDashboard},{label:"Weddings",icon:Heart},{label:"Timeline",icon:CalendarDays},{label:"Vendors",icon:Users},{label:"More",icon:Menu}].map(item=>{const Icon=item.icon;return <button key={item.label} className={activeNav===(item.label==="Home"?"Overview":item.label)?"active":""} onClick={()=>{setActiveNav(item.label==="Home"?"Overview":item.label);if(item.label!=="Home")notify(item.label+" view selected")}}><Icon/><span>{item.label}</span></button>})}</nav>
      {showNew&&<div style={{position:"fixed",inset:0,background:"#17231d70",zIndex:10,display:"grid",placeItems:"center",padding:20}} onClick={()=>setShowNew(false)}><form onSubmit={e=>{e.preventDefault();addTask()}} onClick={e=>e.stopPropagation()} style={{background:"#fff",width:"min(420px,100%)",borderRadius:16,padding:24,boxShadow:"0 20px 70px #17231d30"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><div className="eyebrow">WORKSPACE</div><h2 style={{font:"700 20px Manrope",margin:0}}>Create a task</h2></div><button type="button" className="icon-btn" onClick={()=>setShowNew(false)} aria-label="Close"><X/></button></div><label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:8}}>Task name</label><input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Confirm ceremony layout" style={{width:"100%",border:"1px solid #e5e7e2",borderRadius:9,padding:12,outlineColor:"#527d67",fontSize:13,marginBottom:18}}/><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" className="btn" onClick={()=>setShowNew(false)}>Cancel</button><button type="submit" className="btn primary"><Plus/> Create task</button></div></form></div>}
      {toast&&<div className="toast" role="status">{toast}</div>}
    </main>
  </div>;
}
