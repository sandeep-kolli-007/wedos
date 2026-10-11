"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Circle, Plus, Search, RefreshCw, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Task = { id: string; title: string; description?: string | null; status: string; priority: string; due_at: string | null; wedding_id: string | null };
type Wedding = { id: string; title: string };
const inputLabel = "mb-1.5 block text-xs font-medium text-neutral-700";
const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "No due date";

export default function TasksPage() {
  const [tasks,setTasks]=useState<Task[]>([]);
  const [weddings,setWeddings]=useState<Wedding[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("Open");
  const [title,setTitle]=useState("");
  const [priority,setPriority]=useState("normal");
  const [due,setDue]=useState("");
  const [weddingId,setWeddingId]=useState("");
  const [busy,setBusy]=useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const [taskResponse,weddingResponse]=await Promise.all([fetch("/api/tasks",{cache:"no-store"}),fetch("/api/weddings",{cache:"no-store"})]);
      const [taskData,weddingData]=await Promise.all([taskResponse.json(),weddingResponse.json()]);
      if(!taskResponse.ok)throw new Error(taskData.error||"Unable to load tasks");
      if(!weddingResponse.ok && weddingResponse.status!==401)throw new Error(weddingData.error||"Unable to load weddings");
      setTasks(taskData.tasks||[]);setWeddings(weddingData.weddings||[]);
    } catch(cause){setError(cause instanceof Error?cause.message:"Unable to load tasks");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function createTask(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!title.trim())return;setBusy(true);setError("");
    try{
      const response=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:title.trim(),priority,due_at:due?new Date(due).toISOString():null,wedding_id:weddingId||null})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to create task");
      setTasks(prev=>[payload.task,...prev]);setTitle("");setDue("");setPriority("normal");setWeddingId("");
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to create task");}
    finally{setBusy(false);}
  }
  async function toggle(task:Task){
    const done=task.status!=="done";
    try{
      const response=await fetch("/api/tasks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:task.id,done})});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Unable to update task");
      setTasks(prev=>prev.map(item=>item.id===task.id?{...item,status:done?"done":"todo"}:item));
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update task");}
  }
  const filtered=useMemo(()=>tasks.filter(task=>(task.title+" "+(task.description||"")).toLowerCase().includes(query.toLowerCase())&&(filter==="Everything"||(filter==="Open"?task.status!=="done":task.status==="done"))),[tasks,query,filter]);
  const open=tasks.filter(task=>task.status!=="done").length;

  return <main className="min-h-screen bg-neutral-50 text-neutral-900">
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-8"><Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"><ArrowLeft size={15}/> Overview</Link><span className="hidden text-[10px] font-semibold tracking-[.15em] text-neutral-400 sm:inline">WEDOS / TASKS</span><Link href="/weddings" className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Wedding workspaces ↗</Link></header>
    <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-500">Planning work</div><h1 className="text-3xl font-semibold tracking-[-1.2px]">Tasks</h1><p className="mt-2 text-sm text-neutral-500">{open} open tasks across your workspace. Changes save to your account.</p></div><Badge variant="outline">{tasks.length} total tasks</Badge></div>
      {error&&<div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={()=>void load()}><RefreshCw size={13}/> Retry</Button></div>}
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(300px,.8fr)_minmax(0,1.5fr)]">
        <Card><CardHeader><div><CardTitle>Create a task</CardTitle><CardDescription>Capture the next action and link it to a wedding.</CardDescription></div><span className="grid size-8 place-items-center rounded-lg bg-neutral-100"><Plus size={16}/></span></CardHeader><CardContent>
          <form onSubmit={createTask} className="space-y-4">
            <div><label className={inputLabel} htmlFor="task-title">Task title</label><Input id="task-title" required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Confirm the venue layout"/></div>
            <div><label className={inputLabel} htmlFor="task-wedding">Wedding workspace</label><select id="task-wedding" value={weddingId} onChange={e=>setWeddingId(e.target.value)} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-100"><option value="">Workspace-wide</option>{weddings.map(wedding=><option key={wedding.id} value={wedding.id}>{wedding.title}</option>)}</select></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div><label className={inputLabel} htmlFor="task-priority">Priority</label><select id="task-priority" value={priority} onChange={e=>setPriority(e.target.value)} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm capitalize outline-none focus:ring-2 focus:ring-neutral-100">{["low","normal","high","urgent"].map(value=><option key={value}>{value}</option>)}</select></div><div><label className={inputLabel} htmlFor="task-due">Due date</label><Input id="task-due" type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></div></div>
            <Button type="submit" disabled={busy||!title.trim()} className="w-full">{busy?"Saving…":<><Plus size={15}/> Save task</>}</Button>
          </form>
        </CardContent></Card>
        <Card>
          <CardHeader><div><CardTitle>Task queue</CardTitle><CardDescription>Filter and update your team’s next actions.</CardDescription></div><div className="hidden size-8 place-items-center rounded-lg bg-neutral-100 sm:grid"><ListTodo size={16}/></div></CardHeader>
          <div className="flex flex-wrap gap-2 border-y border-neutral-100 px-5 py-3">
            <label className="relative min-w-[180px] flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tasks" className="pl-8"/></label>
            <select aria-label="Filter tasks" value={filter} onChange={e=>setFilter(e.target.value)} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs"><option>Open</option><option>Everything</option><option>Completed</option></select>
          </div>
          <CardContent className="pt-0">
            {loading?<div className="space-y-3 py-4">{[1,2,3].map(i=><div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100"/>)}</div>:filtered.length===0?<div className="flex flex-col items-center py-12 text-center"><span className="grid size-10 place-items-center rounded-full bg-neutral-100"><Check size={18}/></span><h3 className="mt-3 text-sm font-semibold">{tasks.length?"No tasks match this view":"No tasks yet"}</h3><p className="mt-1 text-xs text-neutral-500">Create a task to get your planning workflow moving.</p></div>:
            <div className="divide-y divide-neutral-100">{filtered.map(task=><article key={task.id} className="flex items-center gap-3 py-3.5 first:pt-4 last:pb-1">
              <button onClick={()=>void toggle(task)} aria-label={task.status==="done"?"Reopen task":"Complete task"} className={`grid size-[18px] shrink-0 place-items-center rounded border transition-colors ${task.status==="done"?"border-neutral-900 bg-neutral-900 text-white":"border-neutral-300 bg-white text-transparent hover:border-neutral-500"}`}>{task.status==="done"?<Check size={12}/>:<Circle size={12}/>}</button>
              <div className="min-w-0 flex-1"><p className={`truncate text-xs font-medium ${task.status==="done"?"text-neutral-400 line-through":"text-neutral-800"}`}>{task.title}</p><div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-neutral-500">{task.wedding_id&&<Link href={"/weddings/"+task.wedding_id} className="hover:text-neutral-900">{weddings.find(w=>w.id===task.wedding_id)?.title||"Wedding"} ↗</Link>}<span>{dateLabel(task.due_at)}</span></div></div>
              <Badge variant={task.priority==="urgent"?"danger":task.priority==="high"?"warning":"outline"} className="capitalize">{task.priority}</Badge>
            </article>)}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  </main>;
}
